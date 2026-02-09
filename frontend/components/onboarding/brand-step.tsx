"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

interface BrandStepProps {
    initialData?: { name: string; category: string };
    onNext: (data: { name: string; category: string }) => void;
}

export function BrandStep({ initialData, onNext }: BrandStepProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [category, setCategory] = useState(initialData?.category || "");

    const categories = [
        "Beauty & Personal Care",
        "Health, Snacks & Nutrition",
        "Fashion & Lifestyle",
        "Home & Kitchen",
        "Electronics",
        "Other"
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && category) {
            onNext({ name, category });
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-4xl font-light tracking-tight text-white/90">
                    First, let’s name your <span className="font-medium text-white">Truth</span>.
                </h1>
                <p className="text-lg text-white/40">Give us your brand’s name and category.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
                <div className="space-y-6">
                    <div className="group relative">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Brand Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-transparent border-b border-white/10 py-4 text-2xl outline-none focus:border-orange-500 transition-colors placeholder:text-white/10"
                        />
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-orange-500 transition-all duration-500 group-focus-within:w-full" />
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm font-medium text-white/30 uppercase tracking-widest">Industry Category</p>
                        <div className="grid grid-cols-2 gap-3">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={`px-4 py-3 rounded-xl text-left text-sm transition-all border ${category === cat
                                        ? "bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                                        : "bg-transparent border-white/5 text-white/40 hover:border-white/10 hover:bg-white/[0.02]"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!name || !category}
                    className="group flex items-center gap-2 bg-white text-black px-8 py-4 rounded-2xl font-medium transition-all hover:bg-orange-50 disabled:opacity-30 disabled:hover:bg-white"
                >
                    Next Step
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
            </form>
        </div>
    );
}
