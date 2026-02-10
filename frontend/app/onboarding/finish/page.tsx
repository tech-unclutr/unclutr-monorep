"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Store, Wrench, Building2, MapPin, Briefcase, Tag, Clock, ShieldCheck } from 'lucide-react';
import { useOnboarding } from '@/store/onboarding-context';
import { useAuth } from '@/context/auth-context';
import { client } from '@/lib/api/client';
import { api } from '@/lib/api'; // Keep for other calls if any
import { toast } from "sonner";
import { regions, allCurrencies } from '@/data/regions';

interface DataSource {
    id: string;
    name: string;
    display_name?: string;
    logo_url?: string;
    category: string;
}

export default function FinishPage() {
    const router = useRouter();
    const { state } = useOnboarding();
    const { user, refreshAuth } = useAuth();
    const [datasources, setDatasources] = useState<DataSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch datasources to resolve IDs to names/logos
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const data = await api.get('/datasources/', {
                    Authorization: `Bearer ${token}`
                });
                setDatasources(data);
            } catch (err) {
                console.error("Failed to load datasources", err);
                toast.error("Catalogue connection issues", {
                    description: "We couldn't load your selections. Try refreshing the page?"
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // Helper to get datasource by ID
    const getDatasource = (id: string) => datasources.find(d => d.id === id);

    // Helper to render datasource chips
    const renderChips = (ids: string[]) => {
        if (!ids || ids.length === 0) {
            return <p className="text-sm text-zinc-400 italic">None selected</p>;
        }

        return (
            <div className="flex flex-wrap gap-2">
                {ids.map(id => {
                    const ds = getDatasource(id);
                    if (!ds) return null;
                    return (
                        <div key={id} className="inline-flex items-center gap-2 bg-white border border-zinc-200 shadow-sm rounded-lg px-3 py-1.5">
                            {ds.logo_url && (
                                <img src={ds.logo_url} alt="" className="w-4 h-4 object-contain" />
                            )}
                            <span className="text-sm font-medium text-zinc-700">
                                {ds.display_name || ds.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Get all channel IDs
    const allChannelIds = [
        ...(Array.isArray(state.channels.d2c) ? state.channels.d2c : (state.channels.d2c ? [state.channels.d2c] : [])),
        ...(state.channels.marketplaces || []),
        ...(state.channels.qcom || []),
        ...(state.channels.others || [])
    ];

    // Get all stack IDs by category
    const stackByCategory = {
        'Logistics': state.stack.shipping || [],
        'Payments': state.stack.payments || [],
        'Marketing': state.stack.marketing || [],
        'Analytics': state.stack.analytics || [],
        'Accounting': state.stack.finance || []
    };

    const handleFinish = async () => {
        setSaving(true);
        try {
            if (user) {
                // Call finish endpoint to commit everything
                const response = await client.onboarding.finishOnboardingApiV1OnboardingFinishPost();
                // Success

                // CRITICAL: Persist company_id immediately for client.ts headers
                // The API response type needs to be cast or we trust it has company_id based on backend inspection
                const respData = response as any;
                if (respData.company_id) {
                    localStorage.setItem('unclutr_company_id', respData.company_id);
                }

                // CRITICAL: Refresh auth state so the frontend knows we are done
                await refreshAuth();

                // Clear local draft
                localStorage.removeItem('unclutr_onboarding_draft');

                toast.success("Welcome aboard!", {
                    description: "Unleashing your dashboard pulse now..."
                });

                // Delay slightly for toast visibility
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1000);
            }
        } catch (error) {
            console.error("Failed to complete onboarding", error);
            toast.error("Onboarding hit a snag", {
                description: "We couldn't finalize your setup. Let's try once more?"
            });
            setSaving(false);
            return;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-zinc-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
            <div className="max-w-3xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <CheckCircle2 size={32} className="text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 mb-2">
                        You're All Set! 🎉
                    </h1>
                    <p className="text-lg text-zinc-600">
                        Here's what we learned about your business
                    </p>
                    <div className="mt-6">
                        <div className="inline-flex items-center gap-2 bg-zinc-50 border border-zinc-200 text-zinc-600 px-4 py-2 rounded-full">
                            <ShieldCheck size={16} />
                            <span className="text-sm">You are setting up this workspace as the <span className="font-semibold text-zinc-900">Owner</span></span>
                        </div>
                    </div>
                </div>

                {/* Summary Sections */}
                <div className="space-y-6">
                    {/* Brand Information */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Building2 size={20} className="text-zinc-600" />
                                <h2 className="text-lg font-semibold text-zinc-900">Brand Information</h2>
                            </div>
                            <button
                                onClick={() => router.push('/onboarding/basics')}
                                className="text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
                            >
                                Edit
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs font-medium text-zinc-500 uppercase mb-1">Brand Name</p>
                                <p className="text-sm font-medium text-zinc-900">{state.brandName || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-zinc-500 uppercase mb-1">Category</p>
                                <div className="flex items-center gap-2">
                                    {state.category && <Tag size={14} className="text-zinc-400" />}
                                    <p className="text-sm font-medium text-zinc-900">{state.category || 'Not provided'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-zinc-500 uppercase mb-1">Region</p>
                                <div className="flex items-center gap-2">
                                    {state.region?.country && <span className="text-base">{regions.find(r => r.country === state.region.country)?.flag || '🌍'}</span>}
                                    <p className="text-sm font-medium text-zinc-900">
                                        {state.region?.country || 'Not provided'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-zinc-500 uppercase mb-1">Currency</p>
                                <div className="flex items-center gap-2">
                                    {state.region?.currency && <span className="text-base font-serif text-zinc-400">{allCurrencies.find(c => c.code === state.region.currency)?.symbol || '$'}</span>}
                                    <p className="text-sm font-medium text-zinc-900">{state.region?.currency || 'Not provided'}</p>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-xs font-medium text-zinc-500 uppercase mb-1">Timezone</p>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-zinc-400" />
                                    <p className="text-sm font-medium text-zinc-900">{state.region?.timezone || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales Channels */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Store size={20} className="text-zinc-600" />
                                <h2 className="text-lg font-semibold text-zinc-900">
                                    Sales Channels
                                    {allChannelIds.length > 0 && (
                                        <span className="ml-2 text-sm font-normal text-zinc-500">
                                            ({allChannelIds.length} selected)
                                        </span>
                                    )}
                                </h2>
                            </div>
                            <button
                                onClick={() => router.push('/onboarding/channels')}
                                className="text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
                            >
                                Edit
                            </button>
                        </div>
                        {renderChips(allChannelIds)}
                    </div>

                    {/* Tech Stack */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Wrench size={20} className="text-zinc-600" />
                                <h2 className="text-lg font-semibold text-zinc-900">Tech Stack</h2>
                            </div>
                            <button
                                onClick={() => router.push('/onboarding/stack')}
                                className="text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
                            >
                                Edit
                            </button>
                        </div>
                        <div className="space-y-4">
                            {Object.entries(stackByCategory).map(([category, ids]) => (
                                <div key={category}>
                                    <p className="text-xs font-medium text-zinc-500 uppercase mb-2">{category}</p>
                                    {renderChips(ids)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-12 text-center">
                    <button
                        onClick={handleFinish}
                        disabled={saving}
                        className="inline-flex items-center justify-center px-8 py-3 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Go to Dashboard →'}
                    </button>
                    <p className="mt-4 text-sm text-zinc-500">
                        You can always update these settings later
                    </p>
                </div>
            </div>
        </div>
    );
}
