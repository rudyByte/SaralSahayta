import { createHash } from 'crypto';
import { getGroqClient } from '@/lib/ai/groq';
import { buildUserMessage, SYSTEM_PROMPT } from './prompt';
import { buildCacheKey, readCache, writeCache } from './cache';
import {
    CHAT_MAX_TOKENS,
    CHAT_MODEL,
    CHAT_SEED,
    CHAT_TEMPERATURE,
    CHAT_TOP_P,
    MAX_HISTORY_TURNS,
    OUT_OF_SCOPE_ANSWER,
} from './config';
import type { ChatAnswer, ChatTurn, GroundingContext } from './types';

const MAX_ANSWER_CHARS = 1200;

function digestHistory(history: ChatTurn[]): string {
    if (history.length === 0) return 'none';
    return createHash('sha256')
        .update(history.map((turn) => `${turn.role}:${turn.content}`).join('\n'))
        .digest('hex')
        .slice(0, 16);
}

/**
 * Coerces whatever the model returned into a validated answer. Anything that
 * cannot be parsed or cannot be tied back to a real source id degrades into the
 * out-of-scope reply rather than reaching the user as an unverified claim.
 */
function parseModelOutput(raw: string, context: GroundingContext): ChatAnswer {
    let parsed: any;
    try {
        parsed = JSON.parse(raw);
    } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) return { answer: OUT_OF_SCOPE_ANSWER, sourceIds: [], grounded: false };
        try {
            parsed = JSON.parse(match[0]);
        } catch {
            return { answer: OUT_OF_SCOPE_ANSWER, sourceIds: [], grounded: false };
        }
    }

    const answerText = typeof parsed?.answer === 'string' ? parsed.answer.trim() : '';
    if (!answerText) return { answer: OUT_OF_SCOPE_ANSWER, sourceIds: [], grounded: false };

    // Rule 4 says ids stay out of the prose; strip them if the model slipped.
    const cleaned = answerText
        .replace(/\[(S\d+)(,\s*S\d+)*\]/g, '')
        .replace(/[ \t]{2,}/g, ' ')
        .trim()
        .slice(0, MAX_ANSWER_CHARS);

    const validIds = new Set(context.sources.map((source) => source.id));
    const claimedIds: string[] = Array.isArray(parsed?.source_ids)
        ? parsed.source_ids.map((id: unknown) => String(id).trim().toUpperCase())
        : [];
    const sourceIds = claimedIds.filter((id) => validIds.has(id));

    const isRefusal = cleaned === OUT_OF_SCOPE_ANSWER;

    return {
        answer: cleaned,
        sourceIds,
        // Grounded only when the model claims it AND at least one cited source
        // actually exists in the context we assembled.
        grounded: parsed?.grounded === true && !isRefusal && sourceIds.length > 0,
    };
}

export async function answerQuestion(
    question: string,
    history: ChatTurn[],
    context: GroundingContext
): Promise<{ answer: ChatAnswer; cached: boolean }> {
    const trimmedHistory = history.slice(-MAX_HISTORY_TURNS);
    const cacheKey = buildCacheKey(question, `${context.fingerprint}:${digestHistory(trimmedHistory)}`);

    const cachedAnswer = readCache(cacheKey);
    if (cachedAnswer) return { answer: cachedAnswer, cached: true };

    const groq = getGroqClient();
    const startTime = Date.now();

    const completion = await groq.chat.completions.create({
        model: CHAT_MODEL,
        temperature: CHAT_TEMPERATURE,
        top_p: CHAT_TOP_P,
        seed: CHAT_SEED,
        max_tokens: CHAT_MAX_TOKENS,
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...trimmedHistory.map((turn) => ({ role: turn.role, content: turn.content })),
            { role: 'user', content: buildUserMessage(question, context) },
        ],
    });

    const raw = completion.choices?.[0]?.message?.content || '';

    console.log(JSON.stringify({
        event: 'CHAT_COMPLETION',
        model: CHAT_MODEL,
        processingTimeMs: Date.now() - startTime,
        contextFingerprint: context.fingerprint,
        sourceCount: context.sources.length,
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
    }));

    const answer = parseModelOutput(raw, context);
    writeCache(cacheKey, answer);

    return { answer, cached: false };
}
