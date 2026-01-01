/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class HealthService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Health Check Full
     * Comprehensive Health Check for the Developer Dashboard.
     * Checks: Database, Firebase Admin, API Status.
     * @returns any Successful Response
     * @throws ApiError
     */
    public healthCheckFullApiV1HealthFullGet(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/health/full',
        });
    }
}
