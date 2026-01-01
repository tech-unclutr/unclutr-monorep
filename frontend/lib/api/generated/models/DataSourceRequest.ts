/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RequestStatus } from './RequestStatus';
export type DataSourceRequest = {
    id?: string;
    user_id: string;
    email?: (string | null);
    user_name?: (string | null);
    name: string;
    category?: (string | null);
    status?: RequestStatus;
    created_at?: string;
    updated_at?: string;
};

