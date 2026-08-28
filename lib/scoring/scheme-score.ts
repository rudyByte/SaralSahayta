interface MatchResult {
    score: number;
    matched: string[];
    missing: string[];
}

export interface RequiredDocumentForScore {
    id: string;
    code: string;
    name: string;
    isMandatory: boolean;
}

export interface UserDocumentForScore {
    documentId?: string | null;
    code?: string | null;
    name?: string | null;
    verificationStatus?: string | null;
    status?: string | null;
    expiryDate?: string | null;
}

export interface SchemeScoreResult {
    score: number;
    documentScore: number;
    historicalRate: number;
    matchDetails: MatchResult;
    requiredDocuments: RequiredDocumentForScore[];
    uploadedDocumentCodes: string[];
    missingDocumentCodes: string[];
    breakdown: {
        historicalRate: number;
        docsComplete: number;
    };
    suggestions: Array<{ text: string; impact: number }>;
}

const CATEGORY_HISTORICAL_SEED: Record<string, number> = {
    EDUCATION: 0.82,
    AGRICULTURE: 0.72,
    HEALTHCARE: 0.88,
    HOUSING: 0.58,
    ENTREPRENEURSHIP: 0.62,
    WOMEN_CHILD: 0.80,
    SENIOR_CITIZEN: 0.76,
    DISABILITY: 0.78,
    EMPLOYMENT: 0.64,
    SKILL_DEVELOPMENT: 0.70,
};

function categoryHistoricalSeed(category: unknown): number {
    return CATEGORY_HISTORICAL_SEED[String(category || '').toUpperCase()] ?? 0.68;
}

function hashToOffset(input: unknown): number {
    const text = String(input || 'scheme');
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) {
        hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
    }
    return ((hash % 21) - 10) / 100;
}

function schemeHistoricalSeed(scheme: any): number {
    const base = categoryHistoricalSeed(scheme?.category);
    const benefitAmount = Number(scheme?.benefitAmount ?? scheme?.benefit_amount ?? 0);
    const requiredDocs = parseRequiredDocuments(scheme?.requiredDocuments ?? scheme?.required_documents).length;
    const schemeType = String(scheme?.schemeType ?? scheme?.scheme_type ?? '').toUpperCase();

    const benefitFactor = benefitAmount > 200000 ? -0.06 : benefitAmount > 50000 ? -0.03 : benefitAmount > 0 ? 0.03 : 0;
    const documentFactor = requiredDocs >= 6 ? -0.05 : requiredDocs >= 4 ? -0.03 : requiredDocs > 0 ? 0.02 : 0;
    const typeFactor = schemeType === 'CENTRAL' ? 0.02 : -0.01;
    const offset = hashToOffset(scheme?.schemeId ?? scheme?.scheme_id ?? scheme?.id ?? scheme?.name);

    return Math.max(0.35, Math.min(0.92, base + benefitFactor + documentFactor + typeFactor + offset));
}

function normalizeHistoricalRate(value: number | null | undefined, scheme: any): number {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
        return numeric > 1 ? Math.min(numeric / 100, 1) : Math.min(numeric, 1);
    }
    return schemeHistoricalSeed(scheme);
}

function normalizeCode(value: unknown): string {
    return String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function parseRequiredDocuments(raw: any): RequiredDocumentForScore[] {
    let docs: string[] = [];
    if (Array.isArray(raw)) docs = raw;
    else if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            docs = Array.isArray(parsed) ? parsed : [raw];
        } catch {
            docs = raw.trim() ? [raw] : [];
        }
    }

    return docs.filter(Boolean).map((name, index) => ({
        id: `fallback-${index}`,
        code: normalizeCode(name),
        name: String(name),
        isMandatory: true,
    }));
}

export function normalizeRequiredDocumentRows(rows: any[] | null | undefined, scheme: any): RequiredDocumentForScore[] {
    const relational = (rows || []).map((row: any) => {
        const doc = row.documents || row.Document || {};
        const code = normalizeCode(doc.document_code || doc.documentCode || doc.document_name || doc.documentName || row.document_id || row.documentId);
        return {
            id: String(row.document_id || row.documentId || doc.id || code),
            code,
            name: String(doc.document_name || doc.documentName || code),
            isMandatory: row.is_mandatory ?? row.isMandatory ?? true,
        };
    }).filter((doc) => doc.code);

    if (relational.length > 0) return relational;
    return parseRequiredDocuments(scheme?.requiredDocuments ?? scheme?.required_documents);
}

export function normalizeUserDocumentRows(rows: any[] | null | undefined): UserDocumentForScore[] {
    return (rows || []).map((row: any) => {
        const doc = row.documents || row.Document || {};
        return {
            documentId: row.document_id || row.documentId || doc.id,
            code: normalizeCode(doc.document_code || doc.documentCode || row.document_code || row.documentType || row.document_type),
            name: doc.document_name || doc.documentName || row.document_name || row.documentName,
            verificationStatus: row.verification_status || row.verificationStatus || row.status,
            status: row.status,
            expiryDate: row.expiry_date || row.expiryDate,
        };
    });
}

function isUsableUserDocument(doc: UserDocumentForScore): boolean {
    const verification = String(doc.verificationStatus || '').toUpperCase();
    const status = String(doc.status || '').toUpperCase();
    if (verification === 'REJECTED' || status === 'REJECTED' || status === 'EXPIRED') return false;
    if (doc.expiryDate && new Date(doc.expiryDate).getTime() < Date.now()) return false;
    return true;
}

function documentReadiness(requiredDocs: RequiredDocumentForScore[], userDocs: UserDocumentForScore[]) {
    const mandatory = requiredDocs.filter((doc) => doc.isMandatory);
    if (mandatory.length === 0) {
        return { score: 100, uploadedCodes: [] as string[], missingCodes: [] as string[] };
    }

    const userKeys = new Set<string>();
    userDocs.filter(isUsableUserDocument).forEach((doc) => {
        if (doc.documentId) userKeys.add(String(doc.documentId).toLowerCase());
        if (doc.code) userKeys.add(normalizeCode(doc.code));
        if (doc.name) userKeys.add(normalizeCode(doc.name));
    });

    const uploadedCodes: string[] = [];
    const missingCodes: string[] = [];

    for (const req of mandatory) {
        const reqKeys = [String(req.id).toLowerCase(), normalizeCode(req.code), normalizeCode(req.name)].filter(Boolean);
        const uploaded = reqKeys.some((key) => userKeys.has(key));
        if (uploaded) uploadedCodes.push(req.code);
        else missingCodes.push(req.code);
    }

    return {
        score: Math.round((uploadedCodes.length / mandatory.length) * 100),
        uploadedCodes,
        missingCodes,
    };
}

function practicalApprovalScore(documentScore: number, historicalRate: number): number {
    const base = historicalRate * 100 * 0.70 + documentScore * 0.30;
    return Math.max(0, Math.min(100, Math.round(base)));
}

function buildSuggestions(docScore: number, missingCodes: string[]) {
    const suggestions: Array<{ text: string; impact: number }> = [];
    if (missingCodes.length > 0) {
        missingCodes.slice(0, 3).forEach((code) => {
            suggestions.push({ text: `Upload ${code.replace(/_/g, ' ')}`, impact: Math.max(5, Math.round(30 / missingCodes.length)) });
        });
    }
    if (docScore < 100) suggestions.push({ text: 'Verify uploaded documents before applying', impact: 8 });
    return suggestions.sort((a, b) => b.impact - a.impact);
}

export function scoreSchemeForUser(params: {
    scheme: any;
    profile: any;
    requiredDocuments: RequiredDocumentForScore[];
    userDocuments: UserDocumentForScore[];
    historicalRate?: number | null;
}): SchemeScoreResult {
    const docs = documentReadiness(params.requiredDocuments, params.userDocuments);
    const historicalRate = normalizeHistoricalRate(params.historicalRate, params.scheme);
    const score = practicalApprovalScore(docs.score, historicalRate);
    const matchDetails = {
        score,
        matched: [`Historical success contributes ${Math.round(historicalRate * 70)} points`],
        missing: docs.missingCodes.map((code) => `Upload ${code.replace(/_/g, ' ')}`),
    };

    return {
        score,
        documentScore: docs.score,
        historicalRate,
        matchDetails,
        requiredDocuments: params.requiredDocuments,
        uploadedDocumentCodes: docs.uploadedCodes,
        missingDocumentCodes: docs.missingCodes,
        breakdown: {
            historicalRate,
            docsComplete: docs.score / 100,
        },
        suggestions: buildSuggestions(docs.score, docs.missingCodes),
    };
}

export async function fetchScoringInputs(supabase: any, userId: string, schemeIds: string[]) {
    const [docsRes, reqRes, applicationRes] = await Promise.all([
        supabase
            .from('user_documents')
            .select('document_id, verification_status, status, expiry_date, documents(id, document_code, document_name)')
            .eq('user_id', userId),
        supabase
            .from('scheme_document_requirements')
            .select('scheme_id, document_id, is_mandatory')
            .in('scheme_id', schemeIds),
        supabase
            .from('applications')
            .select('scheme_id, status')
            .in('scheme_id', schemeIds),
    ]);

    if (reqRes.error) {
        console.warn('Could not fetch scheme document requirements for scoring:', reqRes.error.message || reqRes.error);
    }

    const documentIds = Array.from(new Set((reqRes.data || []).map((row: any) => row.document_id).filter(Boolean)));
    let documentMap: Record<string, any> = {};
    if (documentIds.length > 0) {
        const { data: documentRows, error: documentError } = await supabase
            .from('documents')
            .select('id, document_code, document_name')
            .in('id', documentIds);
        if (documentError) {
            console.warn('Could not fetch document metadata for scoring:', documentError.message || documentError);
        }
        documentMap = (documentRows || []).reduce((acc: Record<string, any>, doc: any) => {
            acc[doc.id] = doc;
            return acc;
        }, {});
    }

    const requirementsByScheme: Record<string, RequiredDocumentForScore[]> = {};
    (reqRes.data || []).forEach((row: any) => {
        const schemeId = row.scheme_id || row.schemeId;
        if (!requirementsByScheme[schemeId]) requirementsByScheme[schemeId] = [];
        requirementsByScheme[schemeId].push(...normalizeRequiredDocumentRows([{
            ...row,
            documents: documentMap[row.document_id] || null,
        }], null));
    });

    const historicalByScheme: Record<string, number> = {};
    const statusCounts: Record<string, { decided: number; success: number }> = {};
    (applicationRes.data || []).forEach((row: any) => {
        const schemeId = row.scheme_id || row.schemeId;
        if (!schemeId) return;
        const status = String(row.status || '').toUpperCase();
        const decidedStatuses = ['APPROVED', 'REJECTED', 'DISBURSED'];
        if (!decidedStatuses.includes(status)) return;
        if (!statusCounts[schemeId]) statusCounts[schemeId] = { decided: 0, success: 0 };
        statusCounts[schemeId].decided += 1;
        if (status === 'APPROVED' || status === 'DISBURSED') statusCounts[schemeId].success += 1;
    });

    Object.entries(statusCounts).forEach(([schemeId, counts]) => {
        if (counts.decided > 0) historicalByScheme[schemeId] = counts.success / counts.decided;
    });

    return {
        profile: null,
        userDocuments: normalizeUserDocumentRows(docsRes.data),
        requirementsByScheme,
        historicalByScheme,
    };
}
