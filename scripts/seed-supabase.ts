import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🌱 Starting Supabase seed (HTTP)...');

    const schemes = [
        {
            schemeId: 'PM-KISAN',
            name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
            description: 'A central sector scheme to provide financial assistance to all landholding farmer families across the country.',
            ministry: 'Ministry of Agriculture and Farmers Welfare',
            schemeType: 'CENTRAL',
            category: 'AGRICULTURE',
            benefitType: 'MONETARY',
            benefitAmount: 6000,
            benefitDescription: '₹6,000 per year in three installments.',
            applicationLink: 'https://pmkisan.gov.in/',
            isRolling: true,
            requiredDocuments: ['Aadhaar Card', 'Land Holding Documents', 'Bank Account Details'],
            eligibilityCriteria: { occupation: ['Farmer'], incomeMax: 2000000, ageMin: 18 }
        },
        {
            schemeId: 'PMS-SC',
            name: 'Post Matric Scholarship for SC Students',
            description: 'Scholarships for students belonging to Scheduled Castes for post-matric studies.',
            ministry: 'Ministry of Social Justice and Empowerment',
            schemeType: 'CENTRAL',
            category: 'EDUCATION',
            benefitType: 'SUBSIDY',
            benefitAmount: 12000,
            benefitDescription: 'Maintenance allowance and fee reimbursement.',
            applicationLink: 'https://scholarships.gov.in/',
            deadline: '2026-12-31T23:59:59Z',
            requiredDocuments: ['Caste Certificate', 'Income Certificate', 'Previous Year Marksheet'],
            eligibilityCriteria: { casteCategories: ['SC'], incomeMax: 250000 }
        },
        {
            schemeId: 'AB-PMJAY',
            name: 'Ayushman Bharat PM-JAY',
            description: 'Health insurance scheme providing cover of ₹5 lakhs per family per year.',
            ministry: 'Ministry of Health and Family Welfare',
            schemeType: 'CENTRAL',
            category: 'HEALTHCARE',
            benefitType: 'INSURANCE',
            benefitAmount: 500000,
            benefitDescription: '₹5 lakh health cover per family.',
            applicationLink: 'https://pmjay.gov.in/',
            isRolling: true,
            requiredDocuments: ['Aadhaar Card', 'Ration Card'],
            eligibilityCriteria: { incomeMax: 150000, casteCategories: ['SC', 'ST'] }
        }
    ];

    for (const scheme of schemes) {
        const { error } = await supabase
            .from('schemes')
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
