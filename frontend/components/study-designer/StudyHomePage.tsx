"use client";

import { useState } from "react";
import { ResearchPromptComposer } from "./ResearchPromptComposer";
import { StudyDesignerProvider } from "./StudyDesignerContext";
import { StudyDesignerPage } from "./StudyDesignerPage";

export function StudyHomePage() {
    const [initialPrompt, setInitialPrompt] = useState<string | null>(null);

    if (initialPrompt) {
        return (
            <StudyDesignerProvider initialPrompt={initialPrompt}>
                <StudyDesignerPage />
            </StudyDesignerProvider>
        );
    }

    return (
        <div className="w-full h-full overflow-y-auto scrollbar-subtle bg-background">
            <div className="max-w-[820px] mx-auto px-6 py-10">
                <ResearchPromptComposer onSubmit={setInitialPrompt} />
            </div>
        </div>
    );
}
