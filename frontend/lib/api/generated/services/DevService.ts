/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DevService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Stream Events
     * @returns any Successful Response
     * @throws ApiError
     */
    public streamEventsApiV1DevEventsGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/dev/events',
        });
    }
    /**
     * Reset Onboarding
     * Resets onboarding state for the current user.
     * @returns any Successful Response
     * @throws ApiError
     */
    public resetOnboardingApiV1DevResetOnboardingPost(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/dev/reset-onboarding',
        });
    }
    /**
     * Purge Data
     * Hard purge of all data associated with the current user's companies.
     * DANGER: Dev only.
     * @returns any Successful Response
     * @throws ApiError
     */
    public purgeDataApiV1DevPurgeDataPost(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/dev/purge-data',
        });
    }
}
