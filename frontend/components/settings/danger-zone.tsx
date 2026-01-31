"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, Loader2, Clock } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { createUserRequest, getUserRequests, cancelUserRequest, RequestType } from "@/lib/api/requests"

export function DangerZone() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [requestId, setRequestId] = useState<string | null>(null)

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const requests = await getUserRequests();
                const deletionRequest = requests.find(r =>
                    r.request_type === RequestType.WORKSPACE_DELETION &&
                    r.status !== 'REJECTED' &&
                    r.status !== 'APPROVED' // Assuming approved means deleted, in which case user shouldn't exist or be here. leaving it safer.
                );
                if (deletionRequest) {
                    setIsSubmitted(true);
                    setRequestId(deletionRequest.id);
                }
            } catch (error) {
                console.error("Failed to check deletion request status", error);
            }
        };
        checkStatus();
    }, []);

    const handleDeleteRequest = async () => {
        setIsLoading(true)
        try {
            const req = await createUserRequest({
                name: "Workspace Deletion Request",
                category: "System",
                request_type: RequestType.WORKSPACE_DELETION,
                payload: {
                    reason: "User requested deletion via settings"
                }
            })

            toast.success("Request Received", {
                description: "We've started the protocol. We'll be in touch."
            })
            setIsOpen(false)
            setIsSubmitted(true)
            setRequestId(req.id)
        } catch (error) {
            console.error(error)
            toast.error("Request Failed", {
                description: "Something went wrong. Please try again or contact support."
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleWithdraw = async () => {
        if (!requestId) return;
        setIsLoading(true);
        try {
            await cancelUserRequest(requestId);
            toast.success("Request Cancelled", {
                description: "Your data is safe. We've withdrawn the request."
            });
            setIsSubmitted(false);
            setRequestId(null);
        } catch (error) {
            console.error(error);
            toast.error("Cancellation Failed", {
                description: "We couldn't withdraw the request. Try again?"
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (isSubmitted) {
        return (
            <div className="p-8 rounded-xl border border-yellow-100 dark:border-yellow-900/30 bg-yellow-50/30 dark:bg-yellow-900/10 shadow-sm transition-all">
                <div className="flex items-start justify-between mb-6">
                    <div className="space-y-1">
                        <h3 className="text-base font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Deletion request submitted
                        </h3>
                        <p className="text-sm text-yellow-600/80 dark:text-yellow-400/70 max-w-sm">
                            This request will take a few days to process.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Request Submitted</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">We will contact you shortly.</p>
                        </div>
                        <Button disabled variant="outline" size="sm" className="border-yellow-200 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900/50 dark:text-yellow-400 opacity-100 cursor-not-allowed">
                            Submitted
                        </Button>
                    </div>

                    <div className="text-center pt-2">
                        <p className="text-xs text-muted-foreground">
                            Think it's a mistake?{" "}
                            <button
                                onClick={handleWithdraw}
                                disabled={isLoading}
                                className="text-red-600 dark:text-red-400 hover:underline font-medium disabled:opacity-50"
                            >
                                {isLoading ? "Withdrawing..." : "Withdraw your request"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10 shadow-[0_2px_10px_-4px_rgba(239,68,68,0.05)] transition-all duration-300 hover:shadow-[0_8px_30px_-12px_rgba(239,68,68,0.1)] hover:border-red-200 dark:hover:border-red-900/50 backdrop-blur-xl group">
            <div className="flex items-start justify-between mb-6">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight text-red-700 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Danger Zone
                    </h3>
                    <p className="text-base text-red-600/80 dark:text-red-400/70 max-w-sm">
                        Irreversible actions. Proceed with caution.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-red-100 dark:border-red-900/30 backdrop-blur-sm transition-all hover:border-red-200 dark:hover:border-red-900/50">
                    <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Delete Workspace</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Permanently remove all data and access.</p>
                    </div>

                    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all rounded-lg h-9">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-red-200 dark:border-red-900/30 rounded-2xl p-8">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2 text-xl">
                                    <AlertTriangle className="w-5 h-5" />
                                    Request Workspace Deletion?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-base mt-2">
                                    This action cannot be undone. Our team will review your request and get back to you
                                    shortly to finalize the deletion of your workspace.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-4">
                                <AlertDialogCancel disabled={isLoading} className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleDeleteRequest()
                                    }}
                                    disabled={isLoading}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:text-red-400 dark:border-red-900/30 transition-colors shadow-none rounded-xl"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending Request...
                                        </>
                                    ) : (
                                        "Submit Deletion Request"
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    )
}
