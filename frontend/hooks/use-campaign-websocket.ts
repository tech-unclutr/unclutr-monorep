/**
 * Custom React Hook for WebSocket-based Campaign Updates
 * 
 * Provides real-time updates for campaign execution without polling.
 * Includes automatic reconnection with exponential backoff.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface CampaignStatusData {
    campaign_status: string;
    active_count: number;
    max_concurrency: number;
    agents: any[];
    upcoming_leads: any[];
    history: any[];
    all_leads_by_cohort: Record<string, any[]>;
    is_completed: boolean;
    is_exhausted?: boolean;
    completion_data: any;
    next_leads?: any[]; // Added for WS (Human Queue)
    events?: any[];     // Added for WS (Mission Control)
    execution_windows?: any[]; // Added for scheduling
    campaign_metadata?: any; // Added to fix build error
    user_queue?: any[]; // Added for User Action Panel
    event?: string;
}

interface WebSocketMessage {
    type: 'connected' | 'status_update' | 'agents_update' | 'new_event' | 'user_queue_update' | 'item_locked_update' | 'pong';
    campaign_id?: string;
    data?: CampaignStatusData;
    agents?: any[];
    event?: any;
    message?: string;
    timestamp?: string;
}

interface UseCampaignWebSocketReturn {
    data: CampaignStatusData | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: Error | null;
    reconnect: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds

export function useCampaignWebSocket(campaignId: string | null): UseCampaignWebSocketReturn {
    const { user } = useAuth();
    const [data, setData] = useState<CampaignStatusData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const shouldConnectRef = useRef(true);

    const cleanup = useCallback(() => {
        // Clear ping interval
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }

        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Close WebSocket
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
        setIsConnecting(false);
    }, []);

    const connect = useCallback(async () => {
        if (!campaignId || !user || !shouldConnectRef.current) {
            return;
        }

        // Don't create multiple connections
        if (wsRef.current?.readyState === WebSocket.OPEN ||
            wsRef.current?.readyState === WebSocket.CONNECTING) {
            return;
        }

        cleanup();
        setIsConnecting(true);
        setError(null);

        try {
            // Determine WebSocket URL based on environment
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host === 'localhost:3000' ? 'localhost:8000' : window.location.host;

            // Get token
            const token = await user.getIdToken();
            const wsUrl = `${protocol}//${host}/api/v1/execution/campaign/${campaignId}/ws?token=${token}`;

            console.log('[WebSocket] Connecting to:', wsUrl);
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;


            ws.onopen = () => {
                console.log('[WebSocket] Connected');
                setIsConnected(true);
                setIsConnecting(false);
                setError(null);
                reconnectAttemptsRef.current = 0;
                reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;

                // Start ping/pong to keep connection alive
                pingIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send('ping');
                    }
                }, 10000); // Ping every 10 seconds
            };

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);

                    switch (message.type) {
                        case 'connected':
                            console.log('[WebSocket] Connection confirmed:', message.message);
                            break;

                        case 'status_update':
                            if (message.data) {
                                setData(prev => {
                                    // Optimization: If the payload is identical, return previous state to avoid unnecessary re-renders.
                                    // We use stringify for a quick deep comparison. 
                                    const next = message.data;
                                    if (prev && JSON.stringify(prev) === JSON.stringify(next)) {
                                        return prev;
                                    }

                                    if (prev?.campaign_status !== next?.campaign_status) {
                                        console.log(`[WebSocket] Campaign status changed to: ${next?.campaign_status}`);
                                    }
                                    return next || null;
                                });
                            }
                            break;

                        case 'agents_update':
                            if (message.agents) {
                                setData(prev => prev ? { ...prev, agents: message.agents || [] } : null);
                            }
                            break;

                        case 'new_event':
                            // Handle new events if needed
                            console.log('[WebSocket] New event:', message.event);
                            break;

                        case 'user_queue_update':
                            if (message.data?.user_queue) {
                                setData(prev => prev ? { ...prev, user_queue: message.data?.user_queue } : null);
                            }
                            break;

                        case 'item_locked_update':
                            // Handle lock/unlock events if needed (e.g. toast)
                            console.log('[WebSocket] Item locked/unlocked:', message.message);
                            break;

                        case 'pong':
                            // Connection is alive
                            break;

                        default:
                            console.log('[WebSocket] Unknown message type:', message.type);
                    }
                } catch (err) {
                    console.error('[WebSocket] Error parsing message:', err);
                }
            };

            ws.onerror = (event) => {
                console.error('[WebSocket] Error:', event);
                setError(new Error('WebSocket connection error'));
            };

            ws.onclose = (event) => {
                console.log('[WebSocket] Disconnected:', event.code, event.reason);
                setIsConnected(false);
                setIsConnecting(false);

                // Clear ping interval
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                    pingIntervalRef.current = null;
                }

                // If Auth Error (4001), do not reconnect automatically to avoid spam loops
                if (event.code === 4001) {
                    setError(new Error(`Authentication failed: ${event.reason}`));
                    return;
                }

                // Attempt reconnection with exponential backoff
                if (shouldConnectRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current++;
                    const delay = Math.min(
                        reconnectDelayRef.current * Math.pow(2, reconnectAttemptsRef.current - 1),
                        MAX_RECONNECT_DELAY
                    );

                    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, delay);
                } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
                    setError(new Error('Max reconnection attempts reached'));
                }
            };

        } catch (err) {
            console.error('[WebSocket] Connection error:', err);
            setError(err as Error);
            setIsConnecting(false);
        }
    }, [campaignId, user, cleanup]);


    const reconnect = useCallback(() => {
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
        connect();
    }, [connect]);

    // Connect on mount and when dependencies change
    useEffect(() => {
        shouldConnectRef.current = true;
        connect();

        return () => {
            shouldConnectRef.current = false;
            cleanup();
        };
    }, [connect, cleanup]);

    return {
        data,
        isConnected,
        isConnecting,
        error,
        reconnect
    };
}
