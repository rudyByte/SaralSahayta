export type ChatRole = 'user' | 'assistant';

export interface ChatTurn {
    role: ChatRole;
    content: string;
}

export type SourceKind = 'scheme' | 'platform' | 'profile' | 'application' | 'document';

export interface GroundingSource {
    /** Stable label the model cites, e.g. "S1". */
    id: string;
    kind: SourceKind;
    title: string;
    /** Plain-text facts. Never contains model output. */
    content: string;
    /** In-app link the UI can render as a chip. */
    href?: string;
}

export interface GroundingContext {
    sources: GroundingSource[];
    /** Hash of the serialized context; part of the cache key. */
    fingerprint: string;
    isAuthenticated: boolean;
}

export interface ChatAnswer {
    answer: string;
    /** Source ids the model claims to have used, filtered to real ones. */
    sourceIds: string[];
    grounded: boolean;
}

export interface ChatApiResponse {
    answer: string;
    grounded: boolean;
    sources: Array<Pick<GroundingSource, 'id' | 'kind' | 'title' | 'href'>>;
    cached: boolean;
}
