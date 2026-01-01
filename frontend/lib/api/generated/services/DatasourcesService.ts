/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSource } from '../models/DataSource';
import type { DataSourceCategory } from '../models/DataSourceCategory';
import type { DataSourceRequest } from '../models/DataSourceRequest';
import type { RequestCreate } from '../models/RequestCreate';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DatasourcesService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Read Datasources
     * Retrieve available datasources.
     * @returns DataSource Successful Response
     * @throws ApiError
     */
    public readDatasourcesApiV1DatasourcesGet({
        category,
        isCommon,
    }: {
        category?: (DataSourceCategory | null),
        isCommon?: (boolean | null),
    }): CancelablePromise<Array<DataSource>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/datasources/',
            query: {
                'category': category,
                'is_common': isCommon,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Request Datasource
     * Submit a request for a missing datasource.
     * @returns DataSourceRequest Successful Response
     * @throws ApiError
     */
    public requestDatasourceApiV1DatasourcesRequestPost({
        requestBody,
    }: {
        requestBody: RequestCreate,
    }): CancelablePromise<DataSourceRequest> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/datasources/request',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Requests
     * List all datasource requests (Internal/Control Tower use).
     * @returns DataSourceRequest Successful Response
     * @throws ApiError
     */
    public readRequestsApiV1DatasourcesRequestsGet(): CancelablePromise<Array<DataSourceRequest>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/datasources/requests',
        });
    }
}
