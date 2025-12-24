"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, RefreshCw, LogOut } from "lucide-react";
import { logout } from "@/lib/auth-helpers";
import { useRouter } from "next/navigation";

interface HealthStatus {
    api: string;
    database: string;
    firebase: string;
    vertex_ai: string;
}

export default function DeveloperDashboard() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setLoggingOut(false);
        }
    };

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://localhost:8000/api/v1/health/full");
            const data = await response.json();
            setHealth(data);
        } catch (error) {
            console.error("Failed to fetch health status:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
    }, []);

    const getStatusBadge = (status: string) => {
        if (status === "online" || status === "connected") {
            return <Badge className="bg-green-500">Online</Badge>;
        } else if (status === "pending_sdk") {
            return <Badge variant="secondary">{status}</Badge>;
        } else {
            return <Badge variant="destructive">Offline</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold">Control Tower</h1>
                        <p className="text-muted-foreground mt-2">Developer Dashboard</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={fetchHealth} disabled={loading} size="sm" variant="outline">
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button onClick={handleLogout} disabled={loggingOut} size="sm" variant="destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            {loggingOut ? "Logging out..." : "Logout"}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Backend API</CardTitle>
                            <CardDescription>FastAPI Server</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {health ? getStatusBadge(health.api) : <Badge variant="outline">Loading...</Badge>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Database</CardTitle>
                            <CardDescription>SQLite (Async)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {health ? getStatusBadge(health.database) : <Badge variant="outline">Loading...</Badge>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Firebase Admin</CardTitle>
                            <CardDescription>Auth & Custom Claims</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {health ? getStatusBadge(health.firebase) : <Badge variant="outline">Loading...</Badge>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Vertex AI</CardTitle>
                            <CardDescription>Gemini 1.5 Pro</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {health ? getStatusBadge(health.vertex_ai) : <Badge variant="outline">Loading...</Badge>}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>System Configuration</CardTitle>
                        <CardDescription>Live Environment Details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Maintenance Mode:</span>
                            <Badge variant="outline">Disabled</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Environment:</span>
                            <Badge variant="outline">development</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Firebase Project:</span>
                            <Badge variant="outline">unclutr-monorep</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Documentation</CardTitle>
                        <CardDescription>Quick Access Links</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <a
                            href="http://localhost:8000/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                            <div>
                                <p className="font-medium">Backend API Docs</p>
                                <p className="text-sm text-muted-foreground">Swagger / OpenAPI</p>
                            </div>
                            <ExternalLink className="h-4 w-4" />
                        </a>
                        <a
                            href="https://console.firebase.google.com/project/unclutr-monorep"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                            <div>
                                <p className="font-medium">Firebase Console</p>
                                <p className="text-sm text-muted-foreground">Auth, Database, Storage</p>
                            </div>
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
