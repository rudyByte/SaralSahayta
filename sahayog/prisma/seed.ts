import { PrismaClient, SchemeType, SchemeCategory, ApplicationMode } from '@prisma/client'

const prisma = new PrismaClient()

const schemes = [
    // EDUCATION SCHEMES (20)
    {
        schemeName: "Post Matric Scholarship for Minorities",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Minority Affairs",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "Students from minority communities studying in Class 11 to Ph.D.",
        eligibilityCriteria: {
            minPercentage: 50,
            annualIncomeLimit: 200000,
            casteCategory: ["MINORITY"]
        },
        financialBenefit: "Admission + Tuition fee + Maintenance allowance",
        benefitAmount: 10000,
        requiredDocuments: ["Income Certificate", "Caste Certificate", "Mark Sheet"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://scholarships.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Merit-cum-Means Scholarship for Professional and Technical Courses",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Minority Affairs",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "Students pursuing technical or professional courses",
        eligibilityCriteria: {
            minPercentage: 50,
            annualIncomeLimit: 250000
        },
        financialBenefit: "Full course fee reimbursement + Maintenance",
        benefitAmount: 25000,
        requiredDocuments: ["Income Certificate", "Bonafide Certificate"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://scholarships.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Central Sector Scheme of Scholarships for College and University Students",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Department of Higher Education",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "College/University students",
        eligibilityCriteria: {
            ranking: "Top 20th Percentile",
            annualIncomeLimit: 800000
        },
        financialBenefit: "Rs. 10,000 to Rs. 20,000 per annum",
        benefitAmount: 10000,
        requiredDocuments: ["Income Certificate", "Class 12 Marksheet"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://scholarships.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "National Means-cum-Merit Scholarship Scheme",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Department of School Education & Literacy",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "Students of Class 9 to 12",
        eligibilityCriteria: {
            exam: "Selection Test",
            annualIncomeLimit: 350000
        },
        financialBenefit: "Rs. 12,000 per annum",
        benefitAmount: 12000,
        requiredDocuments: ["Income Certificate", "Caste Certificate"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://scholarships.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Prime Minister's Scholarship Scheme for Central Armed Police Forces",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Home Affairs",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "Wards of CAPF & AR personnel",
        eligibilityCriteria: {
            minPercentage: 60
        },
        financialBenefit: "Rs. 3000/month for girls, Rs. 2500/month for boys",
        benefitAmount: 36000,
        requiredDocuments: ["Service Certificate", "Mark Sheet"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://scholarships.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "AICTE Pragati Scholarship for Girls",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "AICTE",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "Girl students in Technical Education",
        eligibilityCriteria: {
            gender: "FEMALE",
            annualIncomeLimit: 800000
        },
        financialBenefit: "Rs. 50,000 per annum",
        benefitAmount: 50000,
        requiredDocuments: ["Income Certificate", "Admission Letter"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://www.aicte-india.org",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "AICTE Saksham Scholarship Scheme",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "AICTE",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "Specially-abled students",
        eligibilityCriteria: {
            disability: true,
            disabilityPercentage: 40
        },
        financialBenefit: "Rs. 50,000 per annum",
        benefitAmount: 50000,
        requiredDocuments: ["Disability Certificate", "Income Certificate"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://www.aicte-india.org",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Begum Hazrat Mahal National Scholarship",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Minority Affairs",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "Meritorious girl students belonging to minorities",
        eligibilityCriteria: {
            gender: "FEMALE",
            class: ["9", "10", "11", "12"]
        },
        financialBenefit: "Up to Rs. 6000",
        benefitAmount: 6000,
        requiredDocuments: ["Income Certificate", "School Verification"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://scholarships.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Pre-Matric Scholarship for SC Students",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Social Justice",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "SC students in Class 9 & 10",
        eligibilityCriteria: {
            casteCategory: "SC",
            annualIncomeLimit: 250000
        },
        financialBenefit: "Monthly allowance + Ad-hoc grant",
        benefitAmount: 3000,
        requiredDocuments: ["Caste Certificate", "Income Certificate"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://socialjustice.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Top Class Education Scheme for SC Students",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Social Justice",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "SC students in top institutes like IITs, IIMs",
        eligibilityCriteria: {
            casteCategory: "SC",
            admissionIn: "Top Rated Institute"
        },
        financialBenefit: "Full tuition fee + living expenses",
        benefitAmount: 200000,
        requiredDocuments: ["Allotment Letter", "Caste Certificate"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://socialjustice.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "National Fellowship for OBC Students",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Social Justice",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "OBC students pursuing M.Phil and Ph.D.",
        eligibilityCriteria: {
            casteCategory: "OBC",
            course: ["M.Phil", "Ph.D"]
        },
        financialBenefit: "JRF/SRF rates",
        benefitAmount: 31000,
        requiredDocuments: ["Caste Certificate", "Research Proposal"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://scholarships.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Dr. Ambedkar Post Matric Scholarship for EBC Students",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Social Justice",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "Economically Backward Class students",
        eligibilityCriteria: {
            annualIncomeLimit: 100000
        },
        financialBenefit: "Maintenance allowance + fees",
        benefitAmount: 5000,
        requiredDocuments: ["Income Certificate"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://socialjustice.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "UP Scholarship Scheme",
        schemeType: SchemeType.STATE,
        ministryDepartment: "Social Welfare Department, UP",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "Students of Uttar Pradesh",
        eligibilityCriteria: {
            domicile: "Uttar Pradesh"
        },
        financialBenefit: "Variable based on course",
        benefitAmount: 10000,
        requiredDocuments: ["Domicile Certificate", "Income Certificate"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "http://scholarship.up.gov.in",
        lastVerified: new Date(),
        state: "Uttar Pradesh"
    },
    {
        schemeName: "MahaDBT Post Matric Scholarship",
        schemeType: SchemeType.STATE,
        ministryDepartment: "Govt of Maharashtra",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "Students of Maharashtra",
        eligibilityCriteria: {
            domicile: "Maharashtra"
        },
        financialBenefit: "Tuition and Exam fees",
        benefitAmount: 15000,
        requiredDocuments: ["Domicile Certificate", "Income Certificate"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://mahadbtmahait.gov.in",
        lastVerified: new Date(),
        state: "Maharashtra"
    },
    {
        schemeName: "Swami Vivekananda Merit Cum Means Scholarship",
        schemeType: SchemeType.STATE,
        ministryDepartment: "Govt of West Bengal",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "Students of West Bengal",
        eligibilityCriteria: {
            domicile: "West Bengal",
            minPercentage: 60
        },
        financialBenefit: "Rs. 1000 to 5000 per month",
        benefitAmount: 12000,
        requiredDocuments: ["Domicile Certificate", "Income Certificate"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://svmcm.wbhed.gov.in",
        lastVerified: new Date(),
        state: "West Bengal"
    },
    {
        schemeName: "Mukhyamantri Medhavi Vidyarthi Yojana (MMVY)",
        schemeType: SchemeType.STATE,
        ministryDepartment: "Govt of Madhya Pradesh",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "Meritorious students of MP",
        eligibilityCriteria: {
            domicile: "Madhya Pradesh",
            minPercentage: 70
        },
        financialBenefit: "Full fee payment",
        benefitAmount: 50000,
        requiredDocuments: ["Domicile Certificate", "Mark Sheet"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "http://scholarshipportal.mp.nic.in",
        lastVerified: new Date(),
        state: "Madhya Pradesh"
    },
    {
        schemeName: "Kanyashree Prakalpa",
        schemeType: SchemeType.STATE,
        ministryDepartment: "Govt of West Bengal",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "Girl students of WB",
        eligibilityCriteria: {
            gender: "FEMALE",
            age: "13-18"
        },
        financialBenefit: "Annual Scholarship + One time Grant",
        benefitAmount: 25000,
        requiredDocuments: ["Birth Certificate", "Bank Account"],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "https://wbkanyashree.gov.in",
        lastVerified: new Date(),
        state: "West Bengal"
    },
    {
        schemeName: "INSPIRE Scholarship",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "DST",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "Students pursuing Basic & Natural Sciences",
        eligibilityCriteria: {
            ranking: "Top 1%"
        },
        financialBenefit: "Rs. 80,000 per annum",
        benefitAmount: 80000,
        requiredDocuments: ["Mark Sheet", "Endorsement Form"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://online-inspire.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Kishore Vaigyanik Protsahan Yojana (KVPY)",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "DST",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "Students interested in research careers",
        eligibilityCriteria: {
            exam: "Aptitude Test"
        },
        financialBenefit: "Monthly fellowship + contingency grant",
        benefitAmount: 60000,
        requiredDocuments: ["Admit Card", "Caste Certificate"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "http://kvpy.iisc.ernet.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "ONGC Merit Scholarship",
        schemeType: SchemeType.PRIVATE,
        ministryDepartment: "ONGC Foundation",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "SC/ST/OBC students",
        eligibilityCriteria: {
            course: ["Engineering", "MBBS", "MBA"]
        },
        financialBenefit: "Rs. 48,000 per annum",
        benefitAmount: 48000,
        requiredDocuments: ["Caste Certificate", "Income Certificate"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://ongcscholar.org",
        lastVerified: new Date(),
        state: "All India"
    },

    // AGRICULTURE SCHEMES (10)
    {
        schemeName: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Agriculture",
        category: SchemeCategory.AGRICULTURE,
        targetBeneficiary: "Small and Marginal Farmers",
        eligibilityCriteria: {
            landHolding: "Up to 2 hectares"
        },
        financialBenefit: "Rs. 6000 per year in 3 installments",
        benefitAmount: 6000,
        requiredDocuments: ["Aadhaar", "Land Records"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://pmkisan.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Agriculture",
        category: SchemeCategory.AGRICULTURE,
        targetBeneficiary: "All Farmers growing notified crops",
        eligibilityCriteria: {},
        financialBenefit: "Insurance coverage for crop loss",
        requiredDocuments: ["Land Records", "Bank Account"],
        applicationMode: ApplicationMode.BOTH,
        officialLink: "https://pmfby.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Kisan Credit Card (KCC)",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Finance/Agriculture",
        category: SchemeCategory.AGRICULTURE,
        targetBeneficiary: "Farmers/Fishermen/Animal Husbandry farmers",
        eligibilityCriteria: {},
        financialBenefit: "Easy credit access at low interest",
        requiredDocuments: ["Identity Proof", "Land Records"],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "https://pmkisan.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Soil Health Card Scheme",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Agriculture",
        category: SchemeCategory.AGRICULTURE,
        targetBeneficiary: "Farmers",
        eligibilityCriteria: {},
        financialBenefit: "Soil nutrient status report + fertilizer recommendations",
        requiredDocuments: ["Aadhaar"],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "https://soilhealth.dac.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Pradhan Mantri Krishi Sinchai Yojana (PMKSY)",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Jal Shakti",
        category: SchemeCategory.AGRICULTURE,
        targetBeneficiary: "Farmers",
        eligibilityCriteria: {},
        financialBenefit: "Subsidy on micro-irrigation equipment",
        requiredDocuments: ["Land Records", "Aadhaar"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://pmksy.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "e-NAM (National Agriculture Market)",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Agriculture",
        category: SchemeCategory.AGRICULTURE,
        targetBeneficiary: "Farmers, Traders",
        eligibilityCriteria: {},
        financialBenefit: "Better price discovery for produce",
        requiredDocuments: ["Bank Details", "Aadhaar"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://enam.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Paramparagat Krishi Vikas Yojana (PKVY)",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Agriculture",
        category: SchemeCategory.AGRICULTURE,
        targetBeneficiary: "Farmers adopting organic farming",
        eligibilityCriteria: {},
        financialBenefit: "Rs. 50,000 per hectare for 3 years",
        benefitAmount: 50000,
        requiredDocuments: ["Land Records"],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "https://pgsindia-ncof.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Rythu Bandhu Scheme",
        schemeType: SchemeType.STATE,
        ministryDepartment: "Govt of Telangana",
        category: SchemeCategory.AGRICULTURE,
        targetBeneficiary: "Farmers of Telangana",
        eligibilityCriteria: {
            domicile: "Telangana"
        },
        financialBenefit: "Rs. 10,000 per acre per year",
        benefitAmount: 10000,
        requiredDocuments: ["Pattadar Passbook"],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "http://rythubandhu.telangana.gov.in",
        lastVerified: new Date(),
        state: "Telangana"
    },
    {
        schemeName: "KALIA Scheme",
        schemeType: SchemeType.STATE,
        ministryDepartment: "Govt of Odisha",
        category: SchemeCategory.AGRICULTURE,
        targetBeneficiary: "Small farmers, landless cultivators",
        eligibilityCriteria: {
            domicile: "Odisha"
        },
        financialBenefit: "Financial assistance for cultivation & livelihood",
        benefitAmount: 25000,
        requiredDocuments: ["Aadhaar", "Bank Account"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://kalia.odisha.gov.in",
        lastVerified: new Date(),
        state: "Odisha"
    },
    {
        schemeName: "PM KUSUM Scheme",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "MNRE",
        category: SchemeCategory.AGRICULTURE,
        targetBeneficiary: "Farmers",
        eligibilityCriteria: {},
        financialBenefit: "Subsidy for solar pumps",
        requiredDocuments: ["Land Records", "Aadhaar"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://pmkusum.mnre.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },

    // WOMEN & CHILD SCHEMES (10)
    {
        schemeName: "Sukanya Samriddhi Yojana",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Finance",
        category: SchemeCategory.WOMEN,
        targetBeneficiary: "Girl Child below 10 years",
        eligibilityCriteria: {
            gender: "FEMALE",
            ageMax: 10
        },
        financialBenefit: "High interest rate savings account",
        requiredDocuments: ["Birth Certificate", "Parent ID"],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "https://www.nsiindia.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Beti Bachao Beti Padhao",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of WCD",
        category: SchemeCategory.WOMEN,
        targetBeneficiary: "Girl Children",
        eligibilityCriteria: {},
        financialBenefit: "Awareness & education support (Not direct cash transfer)",
        requiredDocuments: [],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "http://www.wcd.nic.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of WCD",
        category: SchemeCategory.WOMEN,
        targetBeneficiary: "Pregnant Women & Lactating Mothers",
        eligibilityCriteria: {
            jobType: "Unorganized Sector"
        },
        financialBenefit: "Rs. 5000 cash incentive",
        benefitAmount: 5000,
        requiredDocuments: ["MCP Card", "Aadhaar"],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "https://wcd.nic.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Ujjwala Yojana",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Petroleum",
        category: SchemeCategory.WOMEN,
        targetBeneficiary: "Women from BPL households",
        eligibilityCriteria: {
            economicStatus: "BPL"
        },
        financialBenefit: "Free LPG connection",
        requiredDocuments: ["BPL Ration Card", "Aadhaar"],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "https://www.pmuy.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Mahila Samman Savings Certificate",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Finance",
        category: SchemeCategory.WOMEN,
        targetBeneficiary: "Women and Girls",
        eligibilityCriteria: {},
        financialBenefit: "7.5% fixed interest for 2 years",
        requiredDocuments: ["Identity Proof"],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "https://www.indiapost.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Ladli Behna Yojana",
        schemeType: SchemeType.STATE,
        ministryDepartment: "Govt of Madhya Pradesh",
        category: SchemeCategory.WOMEN,
        targetBeneficiary: "Women of MP",
        eligibilityCriteria: {
            domicile: "Madhya Pradesh",
            age: "23-60"
        },
        financialBenefit: "Rs. 1000 per month",
        benefitAmount: 12000,
        requiredDocuments: ["Samagra ID", "Aadhaar"],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "https://cmladlibahna.mp.gov.in",
        lastVerified: new Date(),
        state: "Madhya Pradesh"
    },
    {
        schemeName: "Lakshmir Bhandar",
        schemeType: SchemeType.STATE,
        ministryDepartment: "Govt of West Bengal",
        category: SchemeCategory.WOMEN,
        targetBeneficiary: "Women heads of households",
        eligibilityCriteria: {
            domicile: "West Bengal"
        },
        financialBenefit: "Rs. 500/1000 per month",
        benefitAmount: 6000,
        requiredDocuments: ["Swasthya Sathi Card"],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "https://socialwelfare.wb.gov.in",
        lastVerified: new Date(),
        state: "West Bengal"
    },
    {
        schemeName: "Nirbhaya Fund Schemes",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of WCD",
        category: SchemeCategory.WOMEN,
        targetBeneficiary: "Women safety initiatives",
        eligibilityCriteria: {},
        financialBenefit: "Various safety projects",
        requiredDocuments: [],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "https://wcd.nic.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Stand Up India Scheme",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Finance",
        category: SchemeCategory.ENTREPRENEURSHIP,
        targetBeneficiary: "SC/ST and Women entrepreneurs",
        eligibilityCriteria: {},
        financialBenefit: "Loan from 10 Lakh to 1 Crore",
        benefitAmount: 10000000,
        requiredDocuments: ["Project Report", "Identity Proof"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://www.standupmitra.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Rashtriya Mahila Kosh",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of WCD",
        category: SchemeCategory.WOMEN,
        targetBeneficiary: "Women Entrepreneurs",
        eligibilityCriteria: {},
        financialBenefit: "Micro-finance",
        requiredDocuments: ["Project Details"],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "http://rmk.nic.in",
        lastVerified: new Date(),
        state: "All India"
    },

    // SC/ST SCHEMES (5)
    {
        schemeName: "National Overseas Scholarship for SC",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Social Justice",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "SC students for studying abroad",
        eligibilityCriteria: {
            casteCategory: "SC"
        },
        financialBenefit: "Tuition + Maintenance + Air Fare",
        benefitAmount: 3000000,
        requiredDocuments: ["Passport", "Offer Letter"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://nosmsje.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Venture Capital Fund for SCs",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Social Justice",
        category: SchemeCategory.ENTREPRENEURSHIP,
        targetBeneficiary: "SC Entrepreneurs",
        eligibilityCriteria: {
            casteCategory: "SC"
        },
        financialBenefit: "Equity support/Loan",
        requiredDocuments: ["Business Plan"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://www.ifcivcf.com",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Pradhan Mantri Adarsh Gram Yojana",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Social Justice",
        category: SchemeCategory.HOUSING,
        targetBeneficiary: "SC majority villages",
        eligibilityCriteria: {},
        financialBenefit: "Infrastructure development",
        requiredDocuments: [],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "https://pmagy.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Pre-Matric Scholarship for ST Students",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Tribal Affairs",
        category: SchemeCategory.EDUCATION,
        targetBeneficiary: "ST students in Class 9 & 10",
        eligibilityCriteria: {
            casteCategory: "ST",
            annualIncomeLimit: 200000
        },
        financialBenefit: "Monthly stipend",
        benefitAmount: 2250,
        requiredDocuments: ["Caste Certificate", "Income Certificate"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://scholarships.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "NSTFDC Term Loan Scheme",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Tribal Affairs",
        category: SchemeCategory.ENTREPRENEURSHIP,
        targetBeneficiary: "ST Entrepreneurs",
        eligibilityCriteria: {
            casteCategory: "ST"
        },
        financialBenefit: "Term loan up to 25 Lakhs",
        benefitAmount: 2500000,
        requiredDocuments: ["Caste Certificate", "Project Report"],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "https://nstfdc.tribal.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },

    // ENTREPRENEURSHIP SCHEMES (5)
    {
        schemeName: "Pradhan Mantri Mudra Yojana (PMMY)",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "Ministry of Finance",
        category: SchemeCategory.ENTREPRENEURSHIP,
        targetBeneficiary: "Non-Corporate Small Business Sector",
        eligibilityCriteria: {},
        financialBenefit: "Loans up to 10 Lakhs (Shishu, Kishore, Tarun)",
        benefitAmount: 1000000,
        requiredDocuments: ["Identity Proof", "Business Proof"],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "https://www.mudra.org.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Prime Minister's Employment Generation Programme (PMEGP)",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "MSME",
        category: SchemeCategory.ENTREPRENEURSHIP,
        targetBeneficiary: "New Entrepreneurs",
        eligibilityCriteria: {
            ageMin: 18
        },
        financialBenefit: "Subsidy up to 35% on project cost",
        benefitAmount: 2500000,
        requiredDocuments: ["Project Report", "Ed. Qualification"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://www.kviconline.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "MSME",
        category: SchemeCategory.ENTREPRENEURSHIP,
        targetBeneficiary: "MSEs",
        eligibilityCriteria: {},
        financialBenefit: "Collateral free credit",
        requiredDocuments: [],
        applicationMode: ApplicationMode.OFFLINE,
        officialLink: "https://www.cgtmse.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Startup India Seed Fund Scheme",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "DPIIT",
        category: SchemeCategory.ENTREPRENEURSHIP,
        targetBeneficiary: "Early stage startups",
        eligibilityCriteria: {
            recognition: "DPIIT Recognized"
        },
        financialBenefit: "Up to Rs. 20 Lakhs for PoC",
        benefitAmount: 2000000,
        requiredDocuments: ["Pitch Deck"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://seedfund.startupindia.gov.in",
        lastVerified: new Date(),
        state: "All India"
    },
    {
        schemeName: "Atal Innovation Mission (AIM)",
        schemeType: SchemeType.CENTRAL,
        ministryDepartment: "NITI Aayog",
        category: SchemeCategory.ENTREPRENEURSHIP,
        targetBeneficiary: "Innovators, Startups",
        eligibilityCriteria: {},
        financialBenefit: "Grant-in-aid",
        requiredDocuments: ["Proposal"],
        applicationMode: ApplicationMode.ONLINE,
        officialLink: "https://aim.gov.in",
        lastVerified: new Date(),
        state: "All India"
    }
]

async function main() {
    console.log('Start seeding ...')

    // Clear existing schemes
    await prisma.scheme.deleteMany({})

    for (const scheme of schemes) {
        const s = await prisma.scheme.create({
            data: scheme,
        })
        console.log(`Created scheme with id: ${s.id}`)
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
