"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MagicLoader } from "@/components/ui/magic-loader";

export default function OnboardingIndex() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/onboarding/basics");
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <MagicLoader text="Initializing setup..." />
        </div>
    );
}
