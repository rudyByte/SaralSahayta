import { createHash } from 'crypto';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { KNOWLEDGE_BASE } from './knowledge-base';
import {
    MAX_APPLICATION_ROWS,
    MAX_KEYWORDS,
    MAX_PLATFORM_SOURCES,
    MAX_SCHEME_SOURCES,
    MAX_SOURCE_CHARS,
} from './config';
import type { GroundingContext, GroundingSource } from './types';

/**
 * Builds the grounding context for one question.
 *
 * Everything the assistant is allowed to say comes from here. The retrieval is
 * deliberately rule-based rather than embedding-based: the same question over
 * unchanged data must select the same sources in the same order, every time.
 */

const STOPWORDS = new Set([
    'a', 'about', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'can',
    'could', 'did', 'do', 'does', 'for', 'from', 'get', 'give', 'has', 'have', 'how', 'i', 'if',
    'in', 'into', 'is', 'it', 'its', 'know', 'like', 'me', 'more', 'my', 'need', 'not', 'of', 'on',
    'or', 'please', 'should', 'show', 'some', 'tell', 'that', 'the', 'their', 'them', 'there',
    'these', 'they', 'this', 'to', 'told', 'up', 'use', 'want', 'was', 'we', 'were', 'what', 'when',
    'where', 'which', 'who', 'why', 'will', 'with', 'would', 'you', 'your',
]);

/**
 * Question -> ordered, de-duplicated keyword list. Order of first appearance is
 * preserved so the same sentence always yields the same list.
 */
export function extractKeywords(question: string): string[] {
    const tokens = question
        .toLowerCase()
        .replace(/[^a-z0-9\u0900-\u097F\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length >= 3 && !STOPWORDS.has(token));

    const unique: string[] = [];
    for (const token of tokens) {
        if (!unique.includes(token)) unique.push(token);
        if (unique.length >= MAX_KEYWORDS) break;
    }
    return unique;
}

/**
 * Retrieved rows are untrusted input: a scheme description could contain text
 * shaped like an instruction. Flatten it to inert single-line prose.
 */
function sanitize(value: unknown, limit = MAX_SOURCE_CHARS): string {
    if (value === null || value === undefined) return '';
    const text = String(value)
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .replace(/`{3,}/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function formatDate(value: unknown): string {
    if (!value) return '';
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
}

function formatList(value: unknown): string {
    if (Array.isArray(value)) return value.map((item) => sanitize(item, 60)).filter(Boolean).join(', ');
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed.map((item) => sanitize(item, 60)).join(', ');
        } catch {
            // not JSON — fall through to the plain string
        }
        return sanitize(value, 240);
    }
    return '';
}

function schemeName(scheme: any): string {
    return sanitize(scheme.name || scheme.schemeName || scheme.scheme_name || 'Untitled scheme', 160);
}

/** Facts about one scheme, rendered as stable `key: value` lines. */
function describeScheme(scheme: any): string {
    const lines: string[] = [];
    const push = (label: string, value: string) => {
        if (value) lines.push(`${label}: ${value}`);
    };

    push('Name', schemeName(scheme));
    push('Ministry', sanitize(scheme.ministry, 120));
    push('Type', sanitize(scheme.schemeType, 40));
    push('Category', sanitize(scheme.category, 40));
    push('Description', sanitize(scheme.description, 420));
    push('Benefit', sanitize(scheme.benefitDescription, 300));

    if (typeof scheme.benefitAmount === 'number' && scheme.benefitAmount > 0) {
        push('Benefit amount (INR)', String(scheme.benefitAmount));
    }
    if (typeof scheme.minAge === 'number') push('Minimum age', String(scheme.minAge));
    if (typeof scheme.maxAge === 'number') push('Maximum age', String(scheme.maxAge));
    if (typeof scheme.incomeLimit === 'number') push('Annual income limit (INR)', String(scheme.incomeLimit));

    push('Gender eligible', sanitize(scheme.genderEligible, 20));
    push('Categories eligible', formatList(scheme.categoryEligible));
    push('States eligible', formatList(scheme.stateEligible));
    push('Required documents', formatList(scheme.requiredDocuments));
    push('Deadline', scheme.isRolling ? 'Rolling (no fixed deadline)' : formatDate(scheme.deadline));
    push('Official application link', sanitize(scheme.applicationLink, 300));

    return lines.join('\n');
}

/** Deterministic relevance: keyword hits weighted by field, ties broken by id. */
function rankSchemes(schemes: any[], keywords: string[]): any[] {
    const scored = schemes.map((scheme, index) => {
        const name = schemeName(scheme).toLowerCase();
        const body = `${scheme.description || ''} ${scheme.benefitDescription || ''} ${scheme.ministry || ''} ${scheme.category || ''}`.toLowerCase();

        let score = 0;
        for (const keyword of keywords) {
            if (name.includes(keyword)) score += 3;
            if (body.includes(keyword)) score += 1;
        }
        return { scheme, score, index };
    });

    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const aId = String(a.scheme.schemeId || a.scheme.id || '');
        const bId = String(b.scheme.schemeId || b.scheme.id || '');
        if (aId !== bId) return aId < bId ? -1 : 1;
        return a.index - b.index;
    });

    return scored.map((entry) => entry.scheme);
}

async function fetchSchemes(keywords: string[]): Promise<any[]> {
    const admin = createAdminClient();

    const baseQuery = () =>
        admin
            .from('schemes')
            .select('*')
            .eq('isActive', true)
            .order('name', { ascending: true })
            .limit(40);

    if (keywords.length > 0) {
        const filter = keywords
            .flatMap((keyword) => [
                `name.ilike.%${keyword}%`,
                `description.ilike.%${keyword}%`,
                `benefitDescription.ilike.%${keyword}%`,
                `ministry.ilike.%${keyword}%`,
            ])
            .join(',');

        const { data, error } = await baseQuery().or(filter);
        if (!error && data && data.length > 0) return data;
        if (error) console.warn('[chat] scheme keyword search failed, falling back:', error.message);
    }

    const { data, error } = await baseQuery().limit(MAX_SCHEME_SOURCES);
    if (error) {
        console.warn('[chat] scheme fallback fetch failed:', error.message);
        return [];
    }
    return data || [];
}

function matchKnowledge(keywords: string[], question: string) {
    const haystack = question.toLowerCase();

    const scored = KNOWLEDGE_BASE.map((entry, index) => {
        let score = 0;
        for (const keyword of entry.keywords) {
            if (haystack.includes(keyword)) score += 2;
            if (keywords.includes(keyword)) score += 1;
        }
        return { entry, score, index };
    }).filter((item) => item.score > 0);

    scored.sort((a, b) => (b.score !== a.score ? b.score - a.score : a.index - b.index));

    // With no keyword hit at all, still ship the two orientation entries so the
    // assistant can explain itself instead of refusing outright.
    if (scored.length === 0) {
        return KNOWLEDGE_BASE.filter((entry) =>
            entry.slug === 'what-is-saral-sahayta' || entry.slug === 'assistant-limits'
        );
    }

    return scored.slice(0, MAX_PLATFORM_SOURCES).map((item) => item.entry);
}

/** Profile fields safe to put in a prompt. Bank, PAN, and Aadhaar never appear. */
function describeProfile(profile: any): string {
    const lines: string[] = [];
    const push = (label: string, value: unknown) => {
        const text = sanitize(value, 80);
        if (text) lines.push(`${label}: ${text}`);
    };

    push('Name', profile.full_name);
    push('State', profile.state);
    push('District', profile.district);
    push('Social category', profile.category);
    push('Gender', profile.gender);
    push('Education', profile.education);
    push('Occupation', profile.occupation);

    if (typeof profile.annual_income === 'number') {
        lines.push(`Annual income (INR): ${profile.annual_income}`);
    }
    if (profile.date_of_birth) {
        const dob = new Date(profile.date_of_birth);
        if (!Number.isNaN(dob.getTime())) {
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDelta = today.getMonth() - dob.getMonth();
            if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) age -= 1;
            lines.push(`Age (years): ${age}`);
        }
    }
    if (profile.disability === true) lines.push('Disability: yes');
    if (typeof profile.profile_completion_percentage === 'number') {
        lines.push(`Profile completion: ${profile.profile_completion_percentage}%`);
    }
    if (profile.isPremium === true || profile.is_premium === true) lines.push('Premium: active');

    return lines.join('\n');
}

async function fetchAccountSources(): Promise<GroundingSource[]> {
    const sources: GroundingSource[] = [];

    let supabase;
    let userId: string | null = null;
    try {
        supabase = createClient();
        const { data } = await supabase.auth.getUser();
        userId = data?.user?.id ?? null;
    } catch (error: any) {
        console.warn('[chat] auth lookup failed:', error?.message);
        return sources;
    }
    if (!userId || !supabase) return sources;

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (profile) {
        const described = describeProfile(profile);
        if (described) {
            sources.push({
                id: '',
                kind: 'profile',
                title: 'Your profile',
                content: described,
                href: '/profile',
            });
        }
    }

    const { data: applications } = await supabase
        .from('applications')
        .select('id, status, scheme_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(MAX_APPLICATION_ROWS);

    if (applications && applications.length > 0) {
        const schemeIds = Array.from(new Set(applications.map((row: any) => row.scheme_id).filter(Boolean)));
        const names: Record<string, string> = {};

        if (schemeIds.length > 0) {
            const { data: schemes } = await createAdminClient()
                .from('schemes')
                .select('id, name')
                .in('id', schemeIds);
            (schemes || []).forEach((scheme: any) => {
                names[scheme.id] = schemeName(scheme);
            });
        }

        const lines = applications.map((row: any) => {
            const label = names[row.scheme_id] || 'Scheme record unavailable';
            return `${label} — status ${sanitize(row.status, 30) || 'UNKNOWN'}, started ${formatDate(row.created_at) || 'unknown date'}`;
        });

        sources.push({
            id: '',
            kind: 'application',
            title: `Your applications (${applications.length} most recent)`,
            content: lines.join('\n'),
            href: '/applications',
        });
    }

    const { data: documents } = await supabase
        .from('user_documents')
        .select('document_type, document_name, status, expiry_date')
        .eq('user_id', userId)
        .order('document_type', { ascending: true })
        .limit(15);

    if (documents && documents.length > 0) {
        const lines = documents.map((doc: any) => {
            const expiry = formatDate(doc.expiry_date);
            return `${sanitize(doc.document_type || doc.document_name, 80)} — ${sanitize(doc.status, 30) || 'ACTIVE'}${expiry ? `, expires ${expiry}` : ''}`;
        });

        sources.push({
            id: '',
            kind: 'document',
            title: `Your document vault (${documents.length} documents)`,
            content: lines.join('\n'),
            href: '/documents',
        });
    }

    return sources;
}

export async function buildGroundingContext(question: string): Promise<GroundingContext> {
    const keywords = extractKeywords(question);

    // Account lookups must never take the whole request down; a signed-out user
    // simply gets a context with public sources only.
    const [schemes, accountSources] = await Promise.all([
        fetchSchemes(keywords).catch((error) => {
            console.warn('[chat] scheme retrieval failed:', error?.message);
            return [] as any[];
        }),
        fetchAccountSources().catch((error) => {
            console.warn('[chat] account retrieval failed:', error?.message);
            return [] as GroundingSource[];
        }),
    ]);

    const sources: GroundingSource[] = [];

    for (const entry of matchKnowledge(keywords, question)) {
        sources.push({
            id: '',
            kind: 'platform',
            title: entry.title,
            content: entry.content,
            href: entry.href,
        });
    }

    for (const scheme of rankSchemes(schemes, keywords).slice(0, MAX_SCHEME_SOURCES)) {
        sources.push({
            id: '',
            kind: 'scheme',
            title: schemeName(scheme),
            content: describeScheme(scheme),
            href: `/schemes/${scheme.schemeId || scheme.id}`,
        });
    }

    sources.push(...accountSources);

    const numbered = sources.map((source, index) => ({ ...source, id: `S${index + 1}` }));

    const fingerprint = createHash('sha256')
        .update(numbered.map((source) => `${source.id}|${source.title}|${source.content}`).join('\n--\n'))
        .digest('hex')
        .slice(0, 32);

    return {
        sources: numbered,
        fingerprint,
        isAuthenticated: accountSources.length > 0,
    };
}

/** The `CONTEXT` block handed to the model, in a fixed, parseable shape. */
export function serializeContext(context: GroundingContext): string {
    if (context.sources.length === 0) return '(no sources available)';

    return context.sources
        .map((source) => `[${source.id}] (${source.kind}) ${source.title}\n${source.content}`)
        .join('\n\n');
}
