/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { AuthService } from './services/AuthService';
import { DatasourcesService } from './services/DatasourcesService';
import { DefaultService } from './services/DefaultService';
import { DevService } from './services/DevService';
import { HealthService } from './services/HealthService';
import { MetricsService } from './services/MetricsService';
import { OnboardingService } from './services/OnboardingService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class UnclutrClient {
    public readonly auth: AuthService;
    public readonly datasources: DatasourcesService;
    public readonly default: DefaultService;
    public readonly dev: DevService;
    public readonly health: HealthService;
    public readonly metrics: MetricsService;
    public readonly onboarding: OnboardingService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? '',
            VERSION: config?.VERSION ?? '0.1.0',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.auth = new AuthService(this.request);
        this.datasources = new DatasourcesService(this.request);
        this.default = new DefaultService(this.request);
        this.dev = new DevService(this.request);
        this.health = new HealthService(this.request);
        this.metrics = new MetricsService(this.request);
        this.onboarding = new OnboardingService(this.request);
    }
}

