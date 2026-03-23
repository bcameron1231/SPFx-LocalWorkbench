// Types for mock data generators.

import type { ApiClientType } from '../types';

/** Represents a recorded unmatched API request (used by the request recording feature). */
export interface IRecordedRequest {
    url: string;
    method: string;
    clientType: ApiClientType;
    timestamp: number;
}
