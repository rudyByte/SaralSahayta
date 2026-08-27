export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { calculateMatchScore } from '@/lib/matching-algorithm';
import { Gender, Category, Education } from '@prisma/client';

// GET /api/schemes/[id] - Get a single scheme with full document requirements
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabaseAdmin = createAdminClient();

        // 1. Try finding scheme — first by UUID id (only if it looks like a UUID),
        //    then by schemeId slug field, then by name (slugified match)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);

        let scheme: any = null;
        let fetchError: any = null;

        if (isUUID) {
            const res = await supabaseAdmin.from('schemes').select('*').eq('id', params.id).maybeSingle();
            scheme = res.data;
            fetchError = res.error;
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

        if (fetchError || !scheme) {
            return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
        }


        // 2. Increment view count (fire and forget, non-blocking)
        void (async () => {
            try {
                await supabaseAdmin.rpc('increment_scheme_views', { target_scheme_id: scheme.id });
            } catch (err) {
                console.warn('Could not increment view count:', err);
            }
        })();


        // 3. Fetch document requirements from the normalized relational table
        const { data: docRequirements } = await supabaseAdmin
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
        let userProfile: any = null;

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: docs } = await supabaseAdmin
                    .from('user_documents')
                    .select(`
                        document_id,
                        verification_status,
                        documents (
                            id,
                            document_code,
                            document_name
                        )
                    `)
                    .eq('user_id', user.id)
                    .neq('verification_status', 'REJECTED');

                userDocs = docs || [];

                const { data: profile } = await supabaseAdmin
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();
                userProfile = profile;
            }
        } catch (authErr) {
            console.warn('Auth check skipped for scheme detail:', authErr);
        }

        // Build set of uploaded keys for flexible matching
        const uploadedKeys = new Set<string>();
        userDocs.forEach((ud: any) => {
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

        // 5. Calculate match score if user profile is available
        let matchScore: number | null = null;
        let matchDetails: any = null;
        if (userProfile) {
            try {
                const result = calculateMatchScore(
                    { ...scheme, createdAt: scheme.created_at, updatedAt: scheme.updated_at } as any,
                    {
                        gender: userProfile.gender as Gender,
                        category: userProfile.category as Category,
                        annualIncome: userProfile.annual_income,
                        state: userProfile.state,
                        education: userProfile.education as Education,
                        occupation: userProfile.occupation,
                        profileCompletionPercentage: userProfile.profile_completion_percentage || 0,
                        age: userProfile.date_of_birth
                            ? new Date().getFullYear() - new Date(userProfile.date_of_birth).getFullYear()
                            : undefined,
                    }
                );
                matchScore = result?.score ?? null;
                matchDetails = result;
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
                // Provide the normalized count so cards and detail show consistent numbers
                requiredDocumentsCount: requirements.length,
                matchScore,
                matchDetails,
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
