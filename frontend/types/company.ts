export interface PresenceLink {
    id: string; // or uuid
    label: string;
    url: string;
    type: string; // 'website' | 'instagram' | 'linkedin' etc.
}

export interface Company {
    id: string;
    brand_name: string;
    legal_name?: string;
    founded_year?: string;
    tagline?: string;
    industry?: string; // Primary category
    hq_city?: string;
    support_email?: string;
    support_phone?: string;
    support_hours?: string;

    // JSON fields
    tags: string[];
    presence_links: PresenceLink[];

    // Read only / System
    role?: string; // from user membership, might need a separate type or enriched response
    email?: string; // current user's email, not company's

    currency: string;
    timezone: string;
    stack_data?: any;
    channels_data?: any;
}

export interface CompanyUpdate {
    brand_name?: string;
    legal_name?: string;
    founded_year?: string;
    tagline?: string;
    industry?: string;
    hq_city?: string;
    support_email?: string;
    support_phone?: string;
    support_hours?: string;
    tags?: string[];
    presence_links?: PresenceLink[];
    currency?: string;
    timezone?: string;
}
