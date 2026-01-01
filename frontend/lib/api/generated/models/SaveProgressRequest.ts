/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BasicsData } from './BasicsData';
import type { ChannelsData } from './ChannelsData';
import type { FinishData } from './FinishData';
import type { StackData } from './StackData';
export type SaveProgressRequest = {
    page: 'basics' | 'channels' | 'stack' | 'finish';
    data: (BasicsData | ChannelsData | StackData | FinishData | Record<string, any>);
};

