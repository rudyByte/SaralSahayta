export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { answerQuestion } from '@/lib/ai/chat/answer';
import { buildGroundingContext } from '@/lib/ai/chat/retrieval';
import { checkRateLimit } from '@/lib/ai/chat/cache';
import { MAX_HISTORY_TURNS, MAX_QUESTION_LENGTH } from '@/lib/ai/chat/config';
import type { ChatApiResponse } from '@/lib/ai/chat/types';

const requestSchema = z.object({
    message: z.string().trim().min(2, 'Message is too short').max(MAX_QUESTION_LENGTH),
    history: z
        .array(
            z.object({
                role: z.enum(['user', 'assistant']),
                content: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
            })
        )
        .max(MAX_HISTORY_TURNS)
        .optional()
        .default([]),
});

/** Prefers the signed-in user id so one browser cannot dodge the limit by IP. */
async function resolveIdentity(request: Request): Promise<string> {
    try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) return `user:${data.user.id}`;
    } catch {
        // Signed out, or cookies unavailable — fall through to the IP bucket.
    }

    const forwarded = request.headers.get('x-forwarded-for') || '';
    return `ip:${forwarded.split(',')[0].trim() || 'unknown'}`;
}

export async function POST(request: Request) {
    try {
        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                { error: 'The assistant is not configured on this server (missing GROQ_API_KEY).' },
                { status: 503 }
            );
        }

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const parsed = requestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Invalid request' },
                { status: 400 }
            );
        }

        const identity = await resolveIdentity(request);
        const limit = checkRateLimit(identity);
        if (!limit.allowed) {
            return NextResponse.json(
                { error: 'Too many questions in a short time. Please wait a moment.' },
                { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
            );
        }

        const { message, history } = parsed.data;

        const context = await buildGroundingContext(message);
        const { answer, cached } = await answerQuestion(message, history, context);

        const citedIds = new Set(answer.sourceIds);
        const payload: ChatApiResponse = {
            answer: answer.answer,
            grounded: answer.grounded,
            sources: context.sources
                .filter((source) => citedIds.has(source.id))
                .map(({ id, kind, title, href }) => ({ id, kind, title, href })),
            cached,
        };

        return NextResponse.json(payload, {
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch (error: any) {
        console.error('[chat] request failed:', error?.message);
        return NextResponse.json(
            { error: 'The assistant could not answer right now. Please try again.' },
            { status: 502 }
        );
    }
}
