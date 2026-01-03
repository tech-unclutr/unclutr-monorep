/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Company } from '../models/Company';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class CompaniesService {
    constructor(public readonly httpRequest: BaseHttpRequest) { }

    /**
     * Get company by ID.
     * @param id
     * @returns Company Successful Response
     * @throws ApiError
     */
    public readCompany(
        id: string,
    ): CancelablePromise<Company> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/companies/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Company not found`,
                422: `Validation Error`,
            },
        });
    }

}
