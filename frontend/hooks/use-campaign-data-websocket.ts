import { useCampaignWebSocket } from './use-campaign-websocket';

export function useCampaignData(campaignId: string | null) {
    const { data: wsData, isConnected, error } = useCampaignWebSocket(campaignId);

    return {
        campaign: wsData?.campaign_metadata || null,
        executionWindows: wsData?.execution_windows || [],
        isConnected,
        error,
    };
}
