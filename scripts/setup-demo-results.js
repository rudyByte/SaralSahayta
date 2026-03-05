const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
            }
        });
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDemo() {
    console.log('--- Seeding 6 Demo Schemes ---');

    const demoSchemes = [
        {
            id: 'demo-high-id-101',
            schemeId: 'DEMO-HIGH',
            name: 'Maharashtra Professional Excellence Grant',
            description: 'A prestigious grant for graduates working in the service sector in Maharashtra.',
            ministry: 'Department of Higher & Technical Education, Maharashtra',
            schemeType: 'STATE',
            category: 'EDUCATION',
            benefitType: 'MONETARY',
            benefitAmount: 100000,
            benefitDescription: 'One-time grant of ₹1,00,000 for professional development.',
            applicationLink: 'https://maharashtra.gov.in',
            requiredDocuments: ['Aadhaar', 'Degree Certificate', 'Employment Proof'],
            isRolling: true,
            isActive: true,
            eligibilityCriteria: {
                states: ['Maharashtra'],
                educationLevels: ['GRADUATE'],
                occupation: ['Service'],
                incomeMax: 1000000,
                gender: ['MALE', 'FEMALE', 'OTHER']
            }
        },
        {
            id: 'demo-med-id-101',
            schemeId: 'DEMO-MEDIUM',
            name: 'National Urban Livelihood Mission (NULM)',
            description: 'Support for urban dwellers to enhance skills and livelihoods.',
            ministry: 'Ministry of Housing and Urban Affairs',
            schemeType: 'CENTRAL',
            category: 'SKILL_DEVELOPMENT',
            benefitType: 'SUBSIDY',
            benefitAmount: 25000,
            benefitDescription: 'Interest subsidy on loans.',
            applicationLink: 'https://nulm.gov.in',
            requiredDocuments: ['Aadhaar', 'Income Certificate'],
            isRolling: true,
            isActive: true,
            eligibilityCriteria: {
                incomeMax: 200000,
                casteCategories: ['SC', 'ST', 'OBC'],
            }
        },
        {
            id: 'demo-low-id-001',
            schemeId: 'DEMO-LOW-1',
            name: 'Kanya Sumangala Yojana',
            description: 'Support for the birth of girl children in Uttar Pradesh.',
            ministry: 'Welfare Department, UP',
            schemeType: 'STATE',
            category: 'WOMEN_CHILD',
            benefitType: 'MONETARY',
            benefitAmount: 15000,
            benefitDescription: 'Conditional cash transfer.',
            applicationLink: 'https://mksy.up.gov.in',
            requiredDocuments: ['Birth Certificate', 'Aadhaar'],
            isRolling: true,
            isActive: true,
            eligibilityCriteria: {
                states: ['Uttar Pradesh'],
                gender: ['FEMALE']
            }
        },
        {
            id: 'demo-low-id-002',
            schemeId: 'DEMO-LOW-2',
            name: 'Bihar SC/ST Startup Fund',
            description: 'Special seed funding for SC/ST entrepreneurs in Bihar.',
            ministry: 'Industry Department, Bihar',
            schemeType: 'STATE',
            category: 'ENTREPRENEURSHIP',
            benefitType: 'MONETARY',
            benefitAmount: 1000000,
            benefitDescription: 'Interest-free loan up to ₹10 Lakhs.',
            applicationLink: 'https://startup.bihar.gov.in',
            requiredDocuments: ['Caste Certificate', 'Business Plan'],
            isRolling: true,
            isActive: true,
            eligibilityCriteria: {
                states: ['Bihar'],
                casteCategories: ['SC', 'ST']
            }
        },
        {
            id: 'demo-low-id-003',
            schemeId: 'DEMO-LOW-3',
            name: 'Tribal Artisans Equipment Grant',
            description: 'Equipment support for tribal artisans in Odisha.',
            ministry: 'Tribal Affairs, Odisha',
            schemeType: 'STATE',
            category: 'AGRICULTURE',
            benefitType: 'KIND',
            benefitAmount: 10000,
            benefitDescription: 'Providing modern tools.',
            applicationLink: 'https://odisha.gov.in',
            requiredDocuments: ['Artisan Card', 'Aadhaar'],
            isRolling: true,
            isActive: true,
            eligibilityCriteria: {
                states: ['Odisha'],
                casteCategories: ['ST'],
                occupation: ['Artisan']
            }
        },
        {
            id: 'demo-low-id-004',
            schemeId: 'DEMO-LOW-4',
            name: 'Pradhan Mantri Matru Vandana Yojana',
            description: 'Maternity benefit for pregnant and lactating mothers.',
            ministry: 'Ministry of Women and Child Development',
            schemeType: 'CENTRAL',
            category: 'HEALTHCARE',
            benefitType: 'MONETARY',
            benefitAmount: 5000,
            benefitDescription: 'Direct benefit transfer.',
            applicationLink: 'https://pmmvy.gov.in',
            requiredDocuments: ['MCP Card', 'Aadhaar'],
            isRolling: true,
            isActive: true,
            eligibilityCriteria: {
                gender: ['FEMALE'],
                occupation: ['Unemployed']
            }
        }
    ];

    for (const s of demoSchemes) {
        const { error: seedError } = await supabase
            .from('Scheme')
            .upsert(s, { onConflict: 'schemeId' });

        if (seedError) {
            console.error(`❌ Error seeding ${s.schemeId}:`, seedError.message);
        } else {
            console.log(`✅ Seeded ${s.schemeId}`);
        }
    }

    console.log('✨ Demo configuration complete!');
}

setupDemo();
