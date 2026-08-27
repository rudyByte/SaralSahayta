import { createHash } from 'crypto';
import { CACHE_MAX_ENTRIES, CACHE_TTL_MS, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from './config';
import type { ChatAnswer } from './types';

/**
 * Process-local answer cache and rate limiter.
 *
 * The cache is the last guarantee of determinism: with temperature 0 the model
 * is already near-deterministic, but a repeated question over an unchanged
 * context returns a byte-identical answer because it never reaches the model at
 * all. Single-instance only — swap for Redis before running multiple replicas.
 */

interface CacheEntry {
    answer: ChatAnswer;
    expiresAt: number;
}

const answerCache = new Map<string, CacheEntry>();

/** Normalized so "What is PM Kisan?" and "what is pm kisan" share one entry. */
export function buildCacheKey(question: string, contextFingerprint: string): string {
    const normalizedQuestion = question.toLowerCase().replace(/\s+/g, ' ').trim();
    return createHash('sha256').update(`${contextFingerprint}::${normalizedQuestion}`).digest('hex');
}

export function readCache(key: string): ChatAnswer | null {
    const entry = answerCache.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
        answerCache.delete(key);
        return null;
    }

    // Refresh recency for the LRU eviction below.
    answerCache.delete(key);
    answerCache.set(key, entry);
    return entry.answer;
}

export function writeCache(key: string, answer: ChatAnswer): void {
    if (answerCache.size >= CACHE_MAX_ENTRIES) {
        const oldest = answerCache.keys().next();
        if (!oldest.done) answerCache.delete(oldest.value);
    }
    answerCache.set(key, { answer, expiresAt: Date.now() + CACHE_TTL_MS });
}

const requestLog = new Map<string, number[]>();

export function checkRateLimit(identity: string): { allowed: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    const hits = (requestLog.get(identity) || []).filter((timestamp) => timestamp > windowStart);

    if (hits.length >= RATE_LIMIT_MAX_REQUESTS) {
        requestLog.set(identity, hits);
        const retryAfterSeconds = Math.max(1, Math.ceil((hits[0] + RATE_LIMIT_WINDOW_MS - now) / 1000));
        return { allowed: false, retryAfterSeconds };
    }

    hits.push(now);
    requestLog.set(identity, hits);

    // Opportunistic cleanup so idle identities do not accumulate forever.
    if (requestLog.size > 500) {
        for (const [key, timestamps] of Array.from(requestLog.entries())) {
            if (timestamps.every((timestamp) => timestamp <= windowStart)) requestLog.delete(key);
        }
    }

    return { allowed: true, retryAfterSeconds: 0 };
}
