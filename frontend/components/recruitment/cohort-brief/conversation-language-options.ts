export const CONVERSATION_LANGUAGE_OPTIONS = [
    { value: "english_only", label: "English only" },
    {
        value: "english_default_switch_on_request",
        label: "English (switch on request)",
    },
    { value: "mirror_user", label: "Mirror user's language" },
    { value: "bilingual_pre_written", label: "Bilingual (English + Hinglish)" },
] as const;

export type ConversationLanguage =
    (typeof CONVERSATION_LANGUAGE_OPTIONS)[number]["value"];

export const DEFAULT_CONVERSATION_LANGUAGE: ConversationLanguage = "english_only";
