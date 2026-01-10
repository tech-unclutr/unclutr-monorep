/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type Company = {
    id: string;
    name: string;
    currency?: string;
    timezone?: string;
    industry?: string;
    country?: string;
    stack_data?: Record<string, any>;
    channels_data?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
    updated_by_user_id?: string;
    created_by_user_id?: string;
};
