// ─── Shared types & helpers for recruitment leads ─────────────────────────────

export interface ExtractedLead {
    first_name: string;
    last_name?: string;
    contact_number: string;
    cohort?: string;
    contact_profile?: Record<string, any>;
    meta_data?: Record<string, any>;
}

export interface ColumnMapping {
    customer_name: string;
    contact_number: string;
    cohort: string;
    profile_fields: Record<string, string>;
}

export const PROFILE_TARGETS = [
    { value: "first_name", label: "First Name", icon: "person" },
    { value: "last_name", label: "Last Name", icon: "person" },
    { value: "title", label: "Title", icon: "person" },
    { value: "email", label: "Email", icon: "person" },
    { value: "linkedin_url", label: "LinkedIn URL", icon: "person" },
    { value: "company_name", label: "Company Name", icon: "company" },
    { value: "industry", label: "Industry", icon: "company" },
    { value: "employee_count", label: "Employee Count", icon: "company" },
    { value: "alt_phone", label: "Alt Phone", icon: "person" },
    { value: "city", label: "City", icon: "location" },
    { value: "country", label: "Country", icon: "location" },
] as const;

export const EMPTY_MAPPING: ColumnMapping = {
    customer_name: "",
    contact_number: "",
    cohort: "",
    profile_fields: {},
};

export function autoMapHeaders(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = { ...EMPTY_MAPPING, profile_fields: {} };
    const profileFields: Record<string, string> = {};

    headers.forEach((h) => {
        const low = h.toLowerCase();
        if (low.includes("name") && !low.includes("company")) mapping.customer_name = h;
        if (low.includes("phone") || low.includes("number") || low.includes("contact")) mapping.contact_number = h;
        if (low.includes("cohort") || low.includes("segment") || low.includes("group")) mapping.cohort = h;

        if (low === "first name" || low === "first_name" || low === "firstname") profileFields[h] = "first_name";
        if (low === "last name" || low === "last_name" || low === "lastname") profileFields[h] = "last_name";
        if (low === "title" || low === "designation" || low === "job title" || low === "job_title") profileFields[h] = "title";
        if (low === "email" || low === "e-mail" || low === "email address") profileFields[h] = "email";
        if (low.includes("linkedin")) profileFields[h] = "linkedin_url";
        if (low === "company" || low === "company name" || low === "company_name" || low === "organization") profileFields[h] = "company_name";
        if (low === "industry" || low === "sector") profileFields[h] = "industry";
        if (low.includes("employee") || low.includes("# employee") || low.includes("company size") || low.includes("team size")) profileFields[h] = "employee_count";
        if (low === "city" || low === "location") profileFields[h] = "city";
        if (low === "country" || low === "region") profileFields[h] = "country";
        if ((low === "mobile 2" || low === "mobile2" || low === "alt phone" || low === "alternate phone") && h !== mapping.contact_number) profileFields[h] = "alt_phone";
    });

    mapping.profile_fields = profileFields;
    return mapping;
}

export function buildLeads(rows: any[], mapping: ColumnMapping): ExtractedLead[] {
    if (!mapping.customer_name || !mapping.contact_number) return [];
    return rows.map((row) => {
        const fullName = String(row[mapping.customer_name] || "").trim();
        const spaceIdx = fullName.indexOf(" ");
        const lead: ExtractedLead = {
            first_name: spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName,
            last_name: spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : undefined,
            contact_number: String(row[mapping.contact_number]).trim(),
            meta_data: row,
        };
        if (mapping.cohort && mapping.cohort !== "none" && row[mapping.cohort]) {
            lead.cohort = row[mapping.cohort];
        }
        if (mapping.profile_fields && Object.keys(mapping.profile_fields).length > 0) {
            const profile: Record<string, any> = {};
            for (const [csvCol, targetField] of Object.entries(mapping.profile_fields)) {
                if (row[csvCol] != null && row[csvCol] !== "") {
                    profile[targetField] = row[csvCol];
                }
            }
            if (Object.keys(profile).length > 0) {
                lead.contact_profile = profile;
            }
        }
        return lead;
    });
}
