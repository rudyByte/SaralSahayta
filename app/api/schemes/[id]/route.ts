export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import {
    normalizeRequiredDocumentRows,
    normalizeUserDocumentRows,
    scoreSchemeForUser,
} from '@/lib/scoring/scheme-score';

// GET /api/schemes/[id] - Get a single scheme with full document requirements
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabaseAdmin = createAdminClient();
        let readClient: any = supabaseAdmin;

        // 1. Try finding scheme — first by UUID id (only if it looks like a UUID),
        //    then by schemeId slug field, then by name (slugified match)
        let scheme: any = null;
        let fetchError: any = null;

        {
            const res = await supabaseAdmin.from('schemes').select('*').eq('id', params.id).maybeSingle();
            scheme = res.data;
            fetchError = res.error;
        }

        // Fallback 1: match by slug when the column exists.
        if (!scheme) {
            const res = await supabaseAdmin.from('schemes').select('*').eq('slug', params.id).maybeSingle();
            if (!res.error) { scheme = res.data; fetchError = res.error; }
        }

        // Fallback 1: match by schemeId field (e.g. "PMAY-U", "PM-KISAN")
        if (!scheme) {
            const res = await supabaseAdmin.from('schemes').select('*').eq('schemeId', params.id).maybeSingle();
            if (!res.error) { scheme = res.data; fetchError = res.error; }
        }

        // Fallback 2: legacy slug-style id (e.g. "scheme_4") — try matching name ilike
        if (!scheme && params.id.startsWith('scheme_')) {
            const idx = parseInt(params.id.replace('scheme_', ''), 10);
            if (!isNaN(idx)) {
                const res = await supabaseAdmin.from('schemes').select('*').eq('isActive', true)
                    .range(idx - 1, idx - 1).maybeSingle();
                if (!res.error) { scheme = res.data; fetchError = res.error; }
            }
        }

        // Final fallback: use the same list-style select that powers Discover,
        // then match locally. This protects detail routes from legacy column
        // casing or slug/id filter quirks in older Supabase schemas.
        if (!scheme) {
            const slugify = (value: unknown) => String(value || '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            const requested = decodeURIComponent(params.id);
            const requestedSlug = slugify(requested);
            const res = await supabaseAdmin
                .from('schemes')
                .select('*')
                .limit(500);
            if (!res.error) {
                scheme = (res.data || []).find((candidate: any) => {
                    const values = [
                        candidate.id,
                        candidate.schemeId,
                        candidate.slug,
                        slugify(candidate.name),
                    ].filter(Boolean).map(String);
                    return values.some((value) => value === requested || slugify(value) === requestedSlug);
                }) || null;
                fetchError = null;
            }
        }

        if (fetchError || !scheme) {
            try {
                const standardSupabase = createClient();
                readClient = standardSupabase;
                fetchError = null;

                const exactRes = await standardSupabase.from('schemes').select('*').eq('id', params.id).maybeSingle();
                scheme = exactRes.data;
                fetchError = exactRes.error;

                if (!scheme) {
                    const slugRes = await standardSupabase.from('schemes').select('*').eq('slug', params.id).maybeSingle();
                    if (!slugRes.error) { scheme = slugRes.data; fetchError = slugRes.error; }
                }

                if (!scheme) {
                    const schemeIdRes = await standardSupabase.from('schemes').select('*').eq('schemeId', params.id).maybeSingle();
                    if (!schemeIdRes.error) { scheme = schemeIdRes.data; fetchError = schemeIdRes.error; }
                }

                if (!scheme) {
                    const slugify = (value: unknown) => String(value || '')
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '');
                    const requested = decodeURIComponent(params.id);
                    const requestedSlug = slugify(requested);
                    const listRes = await standardSupabase.from('schemes').select('*').limit(500);
                    if (!listRes.error) {
                        scheme = (listRes.data || []).find((candidate: any) => {
                            const values = [
                                candidate.id,
                                candidate.schemeId,
                                candidate.slug,
                                slugify(candidate.name),
                            ].filter(Boolean).map(String);
                            return values.some((value) => value === requested || slugify(value) === requestedSlug);
                        }) || null;
                        fetchError = null;
                    }
                }
            } catch (fallbackErr) {
                console.warn('Standard client scheme lookup fallback failed:', fallbackErr);
            }
        }

        if (fetchError || !scheme) {
            return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
        }


        // 2. Increment view count (fire and forget, non-blocking)
        void (async () => {
            try {
                await readClient.rpc('increment_scheme_views', { target_scheme_id: scheme.id });
            } catch (err) {
                console.warn('Could not increment view count:', err);
            }
        })();


        // 3. Fetch document requirements from the normalized relational table
        const { data: docRequirements } = await readClient
            .from('scheme_document_requirements')
            .select(`
                id,
                scheme_id,
                document_id,
                is_mandatory,
                display_order,
                help_text,
                documents (
                    id,
                    document_code,
                    document_name,
                    description,
                    category
                )
            `)
            .eq('scheme_id', scheme.id)
            .order('display_order', { ascending: true });

        // 4. If user is logged in, check their uploaded documents
        let userDocs: any[] = [];
        let userId: string | null = null;

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                userId = user.id;
                const { data: docs } = await readClient
                    .from('user_documents')
                    .select(`
                        document_id,
                        verification_status,
                        status,
                        expiry_date,
                        documents (
                            id,
                            document_code,
                            document_name
                        )
                    `)
                    .eq('user_id', user.id)
                    .neq('verification_status', 'REJECTED');

                userDocs = docs || [];
            }
        } catch (authErr) {
            console.warn('Auth check skipped for scheme detail:', authErr);
        }

        // Build set of uploaded keys for flexible matching
        const uploadedKeys = new Set<string>();
        userDocs.forEach((ud: any) => {
            const verification = String(ud.verification_status || '').toUpperCase();
            const status = String(ud.status || '').toUpperCase();
            const isExpiredByDate = ud.expiry_date && new Date(ud.expiry_date).getTime() < Date.now();
            if (verification === 'REJECTED' || status === 'REJECTED' || status === 'EXPIRED' || isExpiredByDate) return;
            if (ud.document_id) uploadedKeys.add(String(ud.document_id).toLowerCase());
            if (ud.documents?.id) uploadedKeys.add(String(ud.documents.id).toLowerCase());
            if (ud.documents?.document_code) uploadedKeys.add(String(ud.documents.document_code).toLowerCase());
            if (ud.documents?.document_name) {
                const normName = String(ud.documents.document_name).toLowerCase().replace(/[^a-z0-9]+/g, '');
                uploadedKeys.add(normName);
            }
        });

        const isDocUploaded = (docId: string, docCode?: string, docName?: string): boolean => {
            if (docId && uploadedKeys.has(String(docId).toLowerCase())) return true;
            if (docCode && uploadedKeys.has(String(docCode).toLowerCase())) return true;
            if (docName) {
                const norm = String(docName).toLowerCase().replace(/[^a-z0-9]+/g, '');
                if (uploadedKeys.has(norm)) return true;
                for (const k of Array.from(uploadedKeys)) {
                    if (k.length >= 3 && (norm.includes(k) || k.includes(norm))) return true;
                }
            }
            return false;
        };

        const { data: historicalRows } = await readClient
            .from('applications')
            .select('status')
            .eq('scheme_id', scheme.id)
            .in('status', ['APPROVED', 'REJECTED', 'DISBURSED']);
        const decidedCount = historicalRows?.length || 0;
        const successCount = (historicalRows || []).filter((row: any) =>
            ['APPROVED', 'DISBURSED'].includes(String(row.status || '').toUpperCase())
        ).length;
        const historicalRate = decidedCount > 0 ? successCount / decidedCount : null;

        // 5. Calculate practical live score if user is available
        let matchScore: number | null = null;
        let matchDetails: any = null;
        let documentScore: number | null = null;
        if (userId) {
            try {
                const scoreResult = scoreSchemeForUser({
                    scheme: { ...scheme, createdAt: scheme.created_at, updatedAt: scheme.updated_at },
                    profile: null,
                    requiredDocuments: normalizeRequiredDocumentRows(docRequirements, scheme),
                    userDocuments: normalizeUserDocumentRows(userDocs),
                    historicalRate,
                });
                matchScore = scoreResult.score;
                matchDetails = scoreResult.matchDetails;
                documentScore = scoreResult.documentScore;
            } catch (matchErr) {
                console.warn('Match score calculation failed:', matchErr);
            }
        }

        // 6. Normalize requirements for DocumentRequirementsList
        let rawDocs: string[] = [];
        const raw = scheme.requiredDocuments || scheme.required_documents;
        if (Array.isArray(raw)) {
            rawDocs = raw;
        } else if (typeof raw === 'string') {
            try {
                rawDocs = JSON.parse(raw);
            } catch {
                if (raw.trim()) rawDocs = [raw];
            }
        }

        let requirements: any[] = [];
        let documentStatus: Record<string, boolean> = {};

        if (docRequirements && docRequirements.length > 0) {
            requirements = docRequirements.map((req: any) => {
                const uploaded = isDocUploaded(
                    req.document_id,
                    req.documents?.document_code,
                    req.documents?.document_name
                );
                documentStatus[req.document_id] = uploaded;
                return {
                    id: req.id,
                    schemeId: req.scheme_id,
                    documentId: req.document_id,
                    isMandatory: req.is_mandatory ?? true,
                    displayOrder: req.display_order ?? 0,
                    helpText: req.help_text || '',
                    documents: req.documents || {
                        id: req.document_id,
                        document_code: 'DOC',
                        document_name: 'Required Document',
                        description: '',
                        category: 'GENERAL'
                    },
                    isUploaded: uploaded,
                };
            });
        } else if (rawDocs.length > 0) {
            requirements = rawDocs.map((docName: string, idx: number) => {
                const docCode = docName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                const docId = `doc-${docCode}`;
                const uploaded = isDocUploaded(docId, docCode, docName);
                documentStatus[docId] = uploaded;
                return {
                    id: `req-synthetic-${idx}`,
                    schemeId: scheme.id,
                    documentId: docId,
                    isMandatory: true,
                    displayOrder: idx + 1,
                    helpText: `Required for ${scheme.name}`,
                    documents: {
                        id: docId,
                        document_code: docCode,
                        document_name: docName,
                        description: `Official document: ${docName}`,
                        category: 'GENERAL'
                    },
                    isUploaded: uploaded,
                };
            });
        }


        return NextResponse.json({
            scheme: {
                ...scheme,
                official_website: scheme.official_website || scheme.officialWebsite || scheme.application_link || scheme.applicationLink || null,
                application_link: scheme.application_link || scheme.applicationLink || scheme.official_website || scheme.officialWebsite || null,
                // Provide the normalized count so cards and detail show consistent numbers
                requiredDocumentsCount: requirements.length,
                matchScore,
                matchDetails,
                documentScore,
                historicalRate,
            },
            requirements,
            documentStatus,
        });


    } catch (error: any) {
        console.error('❌ Scheme detail API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/schemes/[id] - Update scheme (admin only)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('user_profiles').select('is_admin').eq('user_id', user.id).single();
        if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { data: updated, error } = await createAdminClient()
            .from('schemes').update(body).eq('id', params.id).select().single();
        if (error) throw error;
        return NextResponse.json({ scheme: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/schemes/[id] - Delete scheme (admin only)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('user_profiles').select('is_admin').eq('user_id', user.id).single();
        if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { error } = await createAdminClient().from('schemes').delete().eq('id', params.id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
