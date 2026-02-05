import { PrismaClient, SchemeType, SchemeCategory, Gender, Category, Education } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. PM-KISAN (Agriculture)
    await prisma.scheme.upsert({
        where: { schemeId: 'PM-KISAN' },
        update: {},
        create: {
            schemeId: 'PM-KISAN',
            name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
            description: 'A central sector scheme to provide financial assistance to all landholding farmer families across the country to enable them to take care of expenses related to agriculture and allied activities.',
            ministry: 'Ministry of Agriculture and Farmers Welfare',
            schemeType: SchemeType.CENTRAL,
            category: SchemeCategory.AGRICULTURE,
            benefitType: 'MONETARY',
            benefitAmount: 6000,
            benefitDescription: '₹6,000 per year in three equal installments of ₹2,000 every four months.',
            applicationLink: 'https://pmkisan.gov.in/',
            isRolling: true,
            requiredDocuments: ['Aadhaar Card', 'Land Holding Documents', 'Bank Account Details'],
            eligibilityCriteria: {
                occupation: ['Farmer', 'Agriculture'],
                incomeMax: 2000000,
                ageMin: 18
            }
        }
    });

    // 2. Post Matric Scholarship for SC Students (Education)
    await prisma.scheme.upsert({
        where: { schemeId: 'PMS-SC' },
        update: {},
        create: {
            schemeId: 'PMS-SC',
            name: 'Post Matric Scholarship for SC Students',
            description: 'Scholarships for students belonging to Scheduled Castes for studies in India in post-matriculation or post-secondary stages.',
            ministry: 'Ministry of Social Justice and Empowerment',
            schemeType: SchemeType.CENTRAL,
            category: SchemeCategory.EDUCATION,
            benefitType: 'SUBSIDY',
            benefitAmount: 12000,
            benefitDescription: 'Maintenance allowance, reimbursement of non-refundable fees, study tour charges, thesis typing/printing charges, etc.',
            applicationLink: 'https://scholarships.gov.in/',
            deadline: new Date('2026-12-31'),
            requiredDocuments: ['Caste Certificate', 'Income Certificate', 'Previous Year Marksheet'],
            eligibilityCriteria: {
                casteCategories: [Category.SC],
                incomeMax: 250000,
                educationLevels: [Education.UNDERGRADUATE, Education.GRADUATE, Education.POSTGRADUATE]
            }
        }
    });

    // 3. Ayushman Bharat (Healthcare)
    await prisma.scheme.upsert({
        where: { schemeId: 'AB-PMJAY' },
        update: {},
        create: {
            schemeId: 'AB-PMJAY',
            name: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana',
            description: 'The world\'s largest health insurance/assurance scheme fully financed by the government.',
            ministry: 'Ministry of Health and Family Welfare',
            schemeType: SchemeType.CENTRAL,
            category: SchemeCategory.HEALTHCARE,
            benefitType: 'INSURANCE',
            benefitAmount: 500000,
            benefitDescription: 'Health cover of ₹5 lakhs per family per year for secondary and tertiary care hospitalization.',
            applicationLink: 'https://pmjay.gov.in/',
            isRolling: true,
            requiredDocuments: ['Aadhaar Card', 'Ration Card'],
            eligibilityCriteria: {
                incomeMax: 150000,
                casteCategories: [Category.SC, Category.ST]
            }
        }
    });

    // 4. Stand Up India (Entrepreneurship)
    await prisma.scheme.upsert({
        where: { schemeId: 'STAND-UP-INDIA' },
        update: {},
        create: {
            schemeId: 'STAND-UP-INDIA',
            name: 'Stand Up India Scheme',
            description: 'Facilitating bank loans between ₹10 lakh and ₹1 crore to at least one SC or ST borrower and at least one woman borrower per bank branch.',
            ministry: 'Ministry of Finance',
            schemeType: SchemeType.CENTRAL,
            category: SchemeCategory.ENTREPRENEURSHIP,
            benefitType: 'LOAN',
            benefitAmount: 5000000,
            benefitDescription: 'Bank loan between ₹10 lakh and ₹1 crore for setting up a greenfield enterprise.',
            applicationLink: 'https://www.standupmitra.in/',
            isRolling: true,
            requiredDocuments: ['Business Plan', 'KYC Documents', 'Caste Certificate (if applicable)'],
            eligibilityCriteria: {
                ageMin: 18,
                gender: [Gender.FEMALE],
                casteCategories: [Category.SC, Category.ST]
            }
        }
    });

    console.log('✅ Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
