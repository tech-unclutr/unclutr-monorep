/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SaveProgressRequest } from '../models/SaveProgressRequest';
import type { StepData } from '../models/StepData';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class OnboardingService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Onboarding Status
     * Get current onboarding state and resume information.
     *
     * Frontend uses this to:
     * 1. Check if onboarding is complete
     * 2. Determine which page to resume from
     * 3. Hydrate form fields with saved data
     * @returns any Successful Response
     * @throws ApiError
     */
    public getOnboardingStatusApiV1OnboardingStateGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/onboarding/state',
        });
    }
    /**
     * Save Progress
     * Save onboarding progress for a specific page.
     * Called by 'Save & Exit' button or when navigating between pages.
     *
     * Does NOT mark onboarding as complete - use /finish for that.
     * @returns any Successful Response
     * @throws ApiError
     */
    public saveProgressApiV1OnboardingSavePost({
        requestBody,
    }: {
        requestBody: SaveProgressRequest,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/onboarding/save',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Finish Onboarding
     * Complete onboarding and commit all data to production models.
     *
     * Called when user clicks 'Go to Dashboard' on finish page.
     * Creates: Company, Brand, Workspace, Integrations.
     * Marks onboarding as complete.
     *
     * Idempotent: Safe to call multiple times.
     * @returns any Successful Response
     * @throws ApiError
     */
    public finishOnboardingApiV1OnboardingFinishPost(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/onboarding/finish',
        });
    }
    /**
     * Save Step
     * DEPRECATED: Use /save endpoint instead.
     * Kept for backward compatibility.
     *
     * Maps step numbers to page names:
     * - Step 1 → basics
     * - Step 2 → channels
     * - Step 3 → stack
     * - Step 4 → finish
     * @returns any Successful Response
     * @throws ApiError
     */
    public saveStepApiV1OnboardingStepPost({
        requestBody,
    }: {
        requestBody: StepData,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/onboarding/step',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
