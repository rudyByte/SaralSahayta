/**
 * Configuration for the grounded assistant ("Sahayak").
 *
 * Every value here exists to keep answers deterministic: the same question over
 * the same grounding context must produce the same answer on every run.
 */

// Model + decoding parameters. temperature/top_p/seed are pinned; do not expose
// these as request options, otherwise identical questions can diverge.
// Verified available on the configured Groq key (GET /openai/v1/models).
export const CHAT_MODEL = 'openai/gpt-oss-120b';
export const CHAT_TEMPERATURE = 0;
export const CHAT_TOP_P = 1;
export const CHAT_SEED = 20260101;
export const CHAT_MAX_TOKENS = 800;

// Input limits.
export const MAX_QUESTION_LENGTH = 500;
export const MAX_HISTORY_TURNS = 6; // user + assistant messages replayed back

// Retrieval limits — a bigger context is a less deterministic context.
export const MAX_SCHEME_SOURCES = 6;
export const MAX_PLATFORM_SOURCES = 4;
export const MAX_APPLICATION_ROWS = 5;
export const MAX_KEYWORDS = 8;
export const MAX_SOURCE_CHARS = 900; // per source, after truncation

// Response cache: identical (question + context fingerprint) returns the stored
// answer instead of calling the model again. This is what makes repeat runs
// byte-identical even if the provider drifts.
export const CACHE_MAX_ENTRIES = 200;
export const CACHE_TTL_MS = 30 * 60 * 1000;

// Per-identity rate limit (in-memory, single instance).
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const RATE_LIMIT_MAX_REQUESTS = 15;

// The exact sentence the model must emit when the context does not answer the
// question. Kept here so the UI can detect it and offer a fallback action.
export const OUT_OF_SCOPE_ANSWER =
    "I don't have that information in Saral Sahayta's data. Try rephrasing, or browse Discover to search schemes directly.";
