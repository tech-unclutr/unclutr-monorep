/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSourceCategory } from './DataSourceCategory';
export type DataSource = {
    id?: string;
    name: string;
    slug: string;
    category: DataSourceCategory;
    website_url?: (string | null);
    logo_url?: (string | null);
    description?: (string | null);
    auth_method?: (string | null);
    is_active?: boolean;
    is_coming_soon?: boolean;
    is_common?: boolean;
    is_implemented?: boolean;
    theme_color?: (string | null);
    created_at?: string;
    updated_at?: string;
};

