"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, ShoppingBag, Globe, CreditCard, Truck, Megaphone } from "lucide-react";

interface StackStepProps {
    initialSelected?: string[];
    onNext: (stack: string[]) => void;
    onBack: () => void;
}

const STACK_CATEGORIES = [
    {
        id: "storefront",
        name: "Storefronts",
        icon: Globe,
        items: [
            { id: "shopify", name: "Shopify" },
            { id: "woocommerce", name: "WooCommerce" },
            { id: "magento", name: "Magento" },
            { id: "custom", name: "Custom" },
        ],
    },
    {
        id: "marketplace",
        name: "Marketplaces",
        icon: ShoppingBag,
        items: [
            { id: "amazon_in", name: "Amazon India" },
            { id: "flipkart", name: "Flipkart" },
            { id: "nykaa", name: "Nykaa" },
            { id: "myntra", name: "Myntra" },
            { id: "ajio", name: "Ajio" },
            { id: "purplle", name: "Purplle" },
            { id: "blinkit", name: "Blinkit" },
            { id: "zepto", name: "Zepto" },
        ],
    },
    {
        id: "payment",
        name: "Payments",
        icon: CreditCard,
        items: [
            { id: "razorpay", name: "Razorpay" },
            { id: "cashfree", name: "Cashfree" },
            { id: "payu", name: "PayU" },
            { id: "billdesk", name: "BillDesk" },
        ],
    },
    {
        id: "logistics",
        name: "Logistics & OMS",
        icon: Truck,
        items: [
            { id: "shiprocket", name: "Shiprocket" },
            { id: "unicommerce", name: "Unicommerce" },
            { id: "delhivery", name: "Delhivery" },
            { id: "increff", name: "Increff" },
        ],
    },
    {
        id: "marketing",
        name: "Growth & Ads",
        icon: Megaphone,
        items: [
            { id: "meta", name: "Meta Ads" },
            { id: "google_ads", name: "Google Ads" },
            { id: "amazon_ads", name: "Amazon Ads" },
        ],
    },
];

export function StackStep({ initialSelected, onNext, onBack }: StackStepProps) {
    const [selected, setSelected] = useState<string[]>(initialSelected || []);

    const toggleItem = (id: string) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = () => {
        if (selected.length > 0) {
            onNext(selected);
        }
    };

    return (
        <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-4 scrollbar-hide">
            <div className="space-y-2 sticky top-0 bg-[#050505] pb-4 z-10">
                <h1 className="text-4xl font-light tracking-tight text-white/90">
                    Tell us about your <span className="font-medium text-white">Stack</span>.
                </h1>
                <p className="text-lg text-white/40">Select all the tools you use to run your brand.</p>
            </div>

            <div className="space-y-10">
                {STACK_CATEGORIES.map((cat) => (
                    <div key={cat.id} className="space-y-4">
                        <div className="flex items-center gap-2 text-white/30 uppercase tracking-[0.2em] text-[10px] font-bold">
                            <cat.icon className="w-3 h-3" />
                            {cat.name}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {cat.items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => toggleItem(item.id)}
                                    className={`px-4 py-3 rounded-xl text-left text-sm transition-all border ${selected.includes(item.id)
                                        ? "bg-orange-500/10 border-orange-500/50 text-orange-100 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                                        : "bg-transparent border-white/5 text-white/40 hover:border-white/10 hover:bg-white/[0.02]"
                                        }`}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between pt-8 sticky bottom-0 bg-[#050505] py-6 border-t border-white/5">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={selected.length === 0}
                    className="group flex items-center gap-2 bg-white text-black px-8 py-4 rounded-2xl font-medium transition-all hover:bg-orange-50 disabled:opacity-30 disabled:hover:bg-white"
                >
                    Confirm Stack
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    );
}
