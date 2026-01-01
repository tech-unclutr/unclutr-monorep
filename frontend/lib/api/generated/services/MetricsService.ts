/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class MetricsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Metrics Overview
     * Get overview metrics for the control tower dashboard.
     * Returns high-level KPIs and recent activity.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getMetricsOverviewApiV1MetricsOverviewGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/metrics/overview',
        });
    }
    /**
     * Get Business Metrics
     * Get business metrics for the specified number of days.
     * Returns daily KPIs including users, companies, workspaces, and integrations.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getBusinessMetricsApiV1MetricsBusinessGet({
        days = 30,
    }: {
        days?: number,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/metrics/business',
            query: {
                'days': days,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Onboarding Metrics
     * Get onboarding funnel metrics.
     * Returns completion rates, drop-off points, and average time per step.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getOnboardingMetricsApiV1MetricsOnboardingGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/metrics/onboarding',
        });
    }
    /**
     * Get Integration Metrics
     * Get integration health metrics.
     * Returns sync success rates, error rates, and performance metrics.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getIntegrationMetricsApiV1MetricsIntegrationsGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/metrics/integrations',
        });
    }
    /**
     * Get Customer Metrics
     * Get list of customers with their metrics.
     * Returns company information, member counts, and health scores.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getCustomerMetricsApiV1MetricsCustomersGet({
        limit = 50,
        offset,
    }: {
        limit?: number,
        offset?: number,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/metrics/customers',
            query: {
                'limit': limit,
                'offset': offset,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get User Metrics
     * Get user engagement metrics for the specified number of days.
     * Returns daily engagement scores and activity metrics.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getUserMetricsApiV1MetricsUsersGet({
        days = 7,
    }: {
        days?: number,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/metrics/users',
            query: {
                'days': days,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Export Customers Csv
     * Export customer data as CSV.
     * @returns any Successful Response
     * @throws ApiError
     */
    public exportCustomersCsvApiV1MetricsExportCustomersGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/metrics/export/customers',
        });
    }
    /**
     * Calculate Daily Metrics
     * Manually trigger calculation of daily metrics.
     * Useful for backfilling or recalculating metrics.
     * @returns any Successful Response
     * @throws ApiError
     */
    public calculateDailyMetricsApiV1MetricsCalculateDailyPost({
        targetDate,
    }: {
        targetDate?: (string | null),
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/metrics/calculate/daily',
            query: {
                'target_date': targetDate,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
