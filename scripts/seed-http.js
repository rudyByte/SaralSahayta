const { createClient } = require('@supabase/supabase-js');

// These will be read from the environment when running with --env-file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables! Please run with node --env-file=.env');
    process.exit(1);
}

// Custom fetch with retry logic to handle flaky network
const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fetch(url, options);
        } catch (err) {
            if (i === retries - 1) throw err;
            console.warn(`⚠️ Fetch failed, retrying (${i + 1}/${retries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
};

const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
        fetch: fetchWithRetry
    }
});

async function main() {
    console.log('🌱 Starting Supabase seed (HTTP)...');

    const schemes = [
        {
            id: 'scheme_1',
            schemeId: 'PM-KISAN',
            name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
            description: 'Provides financial assistance to all landholding farmer families across the country for agriculture and allied activities.',
            ministry: 'Ministry of Agriculture and Farmers Welfare',
            schemeType: 'CENTRAL',
            category: 'AGRICULTURE',
            benefitType: 'MONETARY',
            benefitAmount: 6000,
            benefitDescription: '₹6,000 per year in three installments of ₹2,000 each.',
            applicationLink: 'https://pmkisan.gov.in/',
            isRolling: true,
            requiredDocuments: ['Aadhaar Card', 'Land Holding Documents', 'Bank Account Details'],
            eligibilityCriteria: { occupation: ['Farmer'], incomeMax: 2000000, ageMin: 18 },
            isActive: true
        },
        {
            id: 'scheme_2',
            schemeId: 'PMS-SC',
            name: 'Post Matric Scholarship for SC Students',
            description: 'Financial assistance to students belonging to Scheduled Castes for pursuing post-matric studies.',
            ministry: 'Ministry of Social Justice and Empowerment',
            schemeType: 'CENTRAL',
            category: 'EDUCATION',
            benefitType: 'SUBSIDY',
            benefitAmount: 12000,
            benefitDescription: 'Covers maintenance allowance, non-refundable fees, and more.',
            applicationLink: 'https://scholarships.gov.in/',
            deadline: '2026-12-31T23:59:59Z',
            requiredDocuments: ['Caste Certificate', 'Income Certificate', 'Academic Records'],
            eligibilityCriteria: { casteCategories: ['SC'], incomeMax: 250000 },
            isActive: true
        },
        {
            id: 'scheme_3',
            schemeId: 'AB-PMJAY',
            name: 'Ayushman Bharat PM-JAY',
            description: 'The world\'s largest health insurance scheme, providing ₹5 lakhs cover per family per year.',
            ministry: 'Ministry of Health and Family Welfare',
            schemeType: 'CENTRAL',
            category: 'HEALTHCARE',
            benefitType: 'INSURANCE',
            benefitAmount: 500000,
            benefitDescription: '₹5 lakh health cover per family for secondary and tertiary care hospitalization.',
            applicationLink: 'https://pmjay.gov.in/',
            isRolling: true,
            requiredDocuments: ['Aadhar/Ration Card', 'PMJAY ID Card'],
            eligibilityCriteria: { incomeMax: 150000, casteCategories: ['SC', 'ST'] },
            isActive: true
        },
        {
            id: 'scheme_4',
            schemeId: 'PMAY-U',
            name: 'Pradhan Mantri Awas Yojana (Urban)',
            description: 'A credit-linked subsidy scheme providing housing for all in urban areas.',
            ministry: 'Ministry of Housing and Urban Affairs',
            schemeType: 'CENTRAL',
            category: 'HOUSING',
            benefitType: 'SUBSIDY',
            benefitAmount: 267000,
            benefitDescription: 'Interest subsidy on home loans for EWS, LIG, and MIG sections.',
            applicationLink: 'https://pmaymis.gov.in/',
            deadline: '2026-03-31T23:59:59Z',
            requiredDocuments: ['Aadhaar Card', 'Income Certificate', 'Property Documents'],
            eligibilityCriteria: { incomeMax: 1800000, casteCategories: ['GENERAL', 'OBC', 'SC', 'ST'] },
            isActive: true
        },
        {
            id: 'scheme_5',
            schemeId: 'SUI-SCHEME',
            name: 'Stand Up India Scheme',
            description: 'Facilitates bank loans between ₹10 lakh and ₹1 crore to at least one SC/ST and one woman borrower per bank branch.',
            ministry: 'Ministry of Finance',
            schemeType: 'CENTRAL',
            category: 'ENTREPRENEURSHIP',
            benefitType: 'LOAN',
            benefitAmount: 10000000,
            benefitDescription: 'Composite loan for setting up a new enterprise in manufacturing, services, or trading.',
            applicationLink: 'https://www.standupmitra.in/',
            isRolling: true,
            requiredDocuments: ['Project Report', 'Bank Statement', 'Aadhaar Card'],
            eligibilityCriteria: { casteCategories: ['SC', 'ST'], ageMin: 18 },
            isActive: true
        },
        {
            id: 'scheme_6',
            schemeId: 'SSY-WOMEN',
            name: 'Sukanya Samriddhi Yojana',
            description: 'A small deposit scheme specifically for a girl child to ensure a bright future.',
            ministry: 'Ministry of Women and Child Development',
            schemeType: 'CENTRAL',
            category: 'WOMEN_CHILD',
            benefitType: 'TAX_SAVINGS',
            benefitAmount: 150000,
            benefitDescription: 'High-interest rate and tax benefits on savings for the girl child.',
            applicationLink: 'https://www.india.gov.in/',
            isRolling: true,
            requiredDocuments: ['Birth Certificate of Girl Child', 'Parent Identity Proof'],
            eligibilityCriteria: { ageMax: 10 },
            isActive: true
        },
        {
            id: 'scheme_7',
            schemeId: 'PMVVY-SR',
            name: 'Pradhan Mantri Vaya Vandana Yojana',
            description: 'A pension scheme for senior citizens providing an assured rate of return.',
            ministry: 'Ministry of Finance',
            schemeType: 'CENTRAL',
            category: 'SENIOR_CITIZEN',
            benefitType: 'PENSION',
            benefitAmount: 120000,
            benefitDescription: 'Guaranteed pension for 10 years.',
            applicationLink: 'https://www.licindia.in/',
            isRolling: true,
            requiredDocuments: ['Aadhaar Card', 'PAN Card', 'Bank Passbook'],
            eligibilityCriteria: { ageMin: 60 },
            isActive: true
        }
    ];
    for (const scheme of schemes) {
        const { error } = await supabase
            .from('Scheme') // Match Prisma model casing
            .upsert(scheme, { onConflict: 'schemeId' });

        if (error) {
            console.error(`❌ Error seeding ${scheme.schemeId}:`, error.message);
        } else {
            console.log(`✅ Seeded ${scheme.schemeId}`);
        }
    }

    console.log('✅ Supabase seed completed!');
}

main().catch(console.error);
