/**
 * Curated, hand-verified facts about how Saral Sahayta itself works.
 *
 * These are the only "product" facts the assistant is allowed to state. Scheme
 * facts come from the database instead (see retrieval.ts). Keep entries short,
 * factual, and in sync with the app — anything not written here the assistant
 * will refuse to answer rather than guess.
 */

export interface KnowledgeEntry {
    slug: string;
    title: string;
    href?: string;
    /** Lowercase match terms. Matching is exact-substring, so include synonyms. */
    keywords: string[];
    content: string;
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
    {
        slug: 'what-is-saral-sahayta',
        title: 'What Saral Sahayta does',
        href: '/dashboard',
        keywords: ['सरल', 'सहायता', 'क्या है', 'what is', 'saral', 'sahayta', 'about', 'platform', 'website', 'app', 'kya hai'],
        content:
            'Saral Sahayta is a single gateway for Indian government schemes and scholarships. It matches a citizen profile against scheme eligibility rules, stores the documents needed to apply, and tracks applications after they are filed. It does not disburse money and it is not a government body.',
    },
    {
        slug: 'eligibility-matching',
        title: 'How eligibility matching works',
        href: '/discover',
        keywords: ['पात्रता', 'योग्य', 'मिलान', 'eligible', 'eligibility', 'match', 'matching', 'score', 'qualify', 'patrata'],
        content:
            'Each scheme carries eligibility rules: age range, gender, social category, state, and income limit. Saral Sahayta compares those rules with the profile and shows a match score on every scheme card. The score is an indication only — the final decision always rests with the issuing department. Match scores are recalculated automatically whenever the profile is updated.',
    },
    {
        slug: 'discover-schemes',
        title: 'Finding schemes',
        href: '/discover',
        keywords: ['योजना', 'योजनाएं', 'खोज', 'छात्रवृत्ति', 'find', 'search', 'discover', 'browse', 'filter', 'scheme', 'schemes', 'scholarship', 'yojana', 'list'],
        content:
            'The Discover page searches schemes by name, description, benefit, and ministry, and filters by category, scheme type (Central, State, Private, NGO), state, and benefit amount. Results can be sorted by match score, benefit amount, or deadline. Scheme categories are: Education, Agriculture, Healthcare, Housing, Entrepreneurship, Women and Child, Senior Citizen, Disability, Employment, and Skill Development.',
    },
    {
        slug: 'document-vault',
        title: 'Document Vault',
        href: '/documents',
        keywords: ['दस्तावेज', 'दस्तावेज़', 'अपलोड', 'कागज', 'प्रमाण', 'document', 'documents', 'upload', 'vault', 'aadhaar', 'certificate', 'proof', 'dastavez', 'file'],
        content:
            'The Document Vault stores documents once and reuses them across applications. Uploads are read with OCR so key fields are extracted automatically, and each document can carry an expiry date. Documents are uploaded from the Document Vault page; supported files are images and PDFs.',
    },
    {
        slug: 'document-readiness',
        title: 'Document readiness and renewals',
        href: '/documents/readiness',
        keywords: ['नवीनीकरण', 'समाप्त', 'वैध', 'readiness', 'missing', 'expired', 'expiry', 'renew', 'renewal', 'valid'],
        content:
            'Document readiness compares the documents already in the vault against what a scheme requires and lists what is still missing. Documents are marked ACTIVE, EXPIRING_SOON, or EXPIRED based on their expiry date, and the renewal page explains how to renew the ones that have lapsed.',
    },
    {
        slug: 'applications',
        title: 'Applying and tracking',
        href: '/applications',
        keywords: ['आवेदन', 'स्थिति', 'ट्रैक', 'apply', 'application', 'applications', 'status', 'track', 'tracking', 'submitted', 'aavedan'],
        content:
            'An application moves through six statuses: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, DISBURSED. Saral Sahayta prepares the application and tracks it, and every scheme carries an official application link where the final submission is made on the government portal. The assistant cannot submit, edit, or withdraw an application for a user.',
    },
    {
        slug: 'life-events',
        title: 'My Journey (life events)',
        href: '/life-events',
        keywords: ['शादी', 'विवाह', 'जन्म', 'सेवानिवृत्ति', 'life event', 'journey', 'marriage', 'childbirth', 'job loss', 'retirement', 'event'],
        content:
            'My Journey records life events such as marriage, childbirth, job change, or retirement. Each recorded event unlocks the schemes tied to it, so the recommendations stay current as circumstances change.',
    },
    {
        slug: 'missed-benefits',
        title: 'Missed benefits report',
        href: '/reports/missed-benefits',
        keywords: ['रिपोर्ट', 'छूटा', 'missed', 'benefit', 'report', 'reports', 'deadline passed'],
        content:
            'The missed benefits report estimates the value of schemes a user was eligible for but did not apply to before the deadline passed. It is a retrospective report and does not reopen a closed application window.',
    },
    {
        slug: 'premium',
        title: 'Premium plans',
        href: '/premium',
        keywords: ['शुल्क', 'कीमत', 'प्रीमियम', 'भुगतान', 'premium', 'price', 'cost', 'pay', 'payment', 'subscription', 'plan', 'fee', 'fees', 'paisa'],
        content:
            'Premium is offered in two forms: a monthly plan at Rs 199 and a per-scheme option at Rs 99. Payments are processed through Razorpay. Browsing schemes, checking eligibility, and using the Document Vault do not require Premium.',
    },
    {
        slug: 'profile',
        title: 'Profile and completeness',
        href: '/profile',
        keywords: ['प्रोफाइल', 'आय', 'जानकारी', 'profile', 'income', 'category', 'state', 'district', 'complete', 'completion', 'percentage', 'update'],
        content:
            'The profile holds name, date of birth, gender, social category, annual income, state, district, education, occupation, disability status, and bank details. A completion percentage is shown on the profile page. The more fields are filled, the more accurate the match scores, because unfilled fields cannot be checked against scheme rules.',
    },
    {
        slug: 'notifications',
        title: 'Notifications',
        href: '/settings/notifications',
        keywords: ['सूचना', 'अलर्ट', 'notification', 'notifications', 'alert', 'reminder', 'sms', 'email', 'settings'],
        content:
            'Notification preferences control deadline reminders, application status updates, and new scheme alerts. They are changed under Settings, Notifications.',
    },
    {
        slug: 'assistant-limits',
        title: 'What this assistant can and cannot do',
        keywords: ['सहायक', 'चैट', 'you', 'chatbot', 'assistant', 'bot', 'sahayak', 'who are you', 'help', 'ai'],
        content:
            'This assistant answers questions using only the scheme records and account data shown to it inside Saral Sahayta. It cannot submit applications, upload documents, change profile or bank details, make payments, or contact a government department. It gives no legal, medical, or financial advice, and it never guesses an eligibility decision — that decision belongs to the issuing department.',
    },
];
