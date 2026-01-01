/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_login_for_access_token_api_v1_auth_login_post } from '../models/Body_login_for_access_token_api_v1_auth_login_post';
import type { UserRead } from '../models/UserRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AuthService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Login For Access Token
     * OAuth2 compatible token login.
     * 1. Checks for Swagger Dev Password (admin).
     * 2. If not dev, attempts real Firebase Auth (Email/Password).
     * @returns any Successful Response
     * @throws ApiError
     */
    public loginForAccessTokenApiV1AuthLoginPost({
        formData,
    }: {
        formData: Body_login_for_access_token_api_v1_auth_login_post,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/auth/login',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Sync User Endpoint
     * Syncs Firebase User to Local DB.
     * Call this after Firebase Login on Frontend.
     * @returns UserRead Successful Response
     * @throws ApiError
     */
    public syncUserEndpointApiV1AuthSyncPost(): CancelablePromise<UserRead> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/auth/sync',
        });
    }
}
