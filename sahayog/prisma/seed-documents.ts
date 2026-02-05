import { PrismaClient, DocumentCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding documents...')

    const documents = [
        // IDENTITY DOCUMENTS (10)
        {
            documentName: 'Aadhaar Card',
            documentCode: 'AADHAAR',
            category: DocumentCategory.IDENTITY,
            description: 'Unique identification number issued by UIDAI.',
            isCommon: true,
            procurementGuideOnline: {
                steps: [
                    { stepNumber: 1, description: 'Visit UIDAI portal (myaadhaar.uidai.gov.in)', url: 'https://myaadhaar.uidai.gov.in/' },
                    { stepNumber: 2, description: 'Login using Aadhaar number and OTP' },
                    { stepNumber: 3, description: 'Update profile or download e-Aadhaar' }
                ],
                processingTime: '7-15 days',
                fees: '₹50 for reprint/update'
            },
            procurementGuideOffline: {
                steps: [
                    { stepNumber: 1, description: 'Visit nearby Aadhaar Enrollment Center' },
                    { stepNumber: 2, description: 'Fill the Enrollment/Update form' },
                    { stepNumber: 3, description: 'Provide biometrics and documents' }
                ],
                officeType: 'Aadhaar Center',
                processingTime: '15-30 days',
                fees: '₹0 for new, ₹50-100 for updates'
            }
        },
        {
            documentName: 'PAN Card',
            documentCode: 'PAN',
            category: DocumentCategory.IDENTITY,
            description: 'Permanent Account Number for tax purposes.',
            isCommon: true,
            procurementGuideOnline: {
                steps: [
                    { stepNumber: 1, description: 'Visit NSDL or UTIITSL portal', url: 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html' },
                    { stepNumber: 2, description: 'Fill Form 49A/49AA' },
                    { stepNumber: 3, description: 'Pay fees and upload documents' }
                ],
                processingTime: '10-15 days',
                fees: '₹107'
            },
            procurementGuideOffline: {
                steps: [
                    { stepNumber: 1, description: 'Visit authorized PAN Centers/UTI offices' },
                    { stepNumber: 2, description: 'Submit physical application and self-attested copies' }
                ],
                officeType: 'PAN Center',
                processingTime: '15-20 days',
                fees: '₹107'
            }
        },
        {
            documentName: 'Voter ID Card',
            documentCode: 'VOTER_ID',
            category: DocumentCategory.IDENTITY,
            description: 'Identity issued by the Election Commission of India.',
            isCommon: true,
            procurementGuideOnline: {
                steps: [
                    { stepNumber: 1, description: 'Visit NVSP portal', url: 'https://www.nvsp.in/' },
                    { stepNumber: 2, description: 'Register as a new voter (Form 6)' }
                ],
                processingTime: '30-45 days',
                fees: '₹0'
            },
            procurementGuideOffline: {
                steps: [
                    { stepNumber: 1, description: 'Visit Electoral Registration Officer (ERO)' },
                    { stepNumber: 2, description: 'Submit Form 6 with photos and address proof' }
                ],
                officeType: 'Electoral Office',
                processingTime: '30-60 days',
                fees: '₹0'
            }
        },
        {
            documentName: 'Driving License',
            documentCode: 'DRIVING_LICENSE',
            category: DocumentCategory.IDENTITY,
            description: 'License to drive vehicles on public roads.',
            procurementGuideOnline: {
                steps: [
                    { stepNumber: 1, description: 'Visit Parivahan Sarathi portal', url: 'https://sarathi.parivahan.gov.in/' },
                    { stepNumber: 2, description: 'Apply for Learner License first' },
                    { stepNumber: 3, description: 'Apply for DL after 30 days of LL' }
                ],
                processingTime: '30-60 days',
                fees: '₹500-2000 depending on vehicle class'
            },
            procurementGuideOffline: {
                steps: [
                    { stepNumber: 1, description: 'Visit local RTO' },
                    { stepNumber: 2, description: 'Take driving test' }
                ],
                officeType: 'RTO Office',
                processingTime: '15-30 days',
                fees: 'Varies'
            }
        },
        {
            documentName: 'Passport',
            documentCode: 'PASSPORT',
            category: DocumentCategory.IDENTITY,
            description: 'Travel document for international travel.',
            procurementGuideOnline: {
                steps: [
                    { stepNumber: 1, description: 'Register at Passport Seva portal', url: 'https://www.passportindia.gov.in/' },
                    { stepNumber: 2, description: 'Schedule appointment at PSK/POPSK' }
                ],
                processingTime: '15-45 days',
                fees: '₹1500 (Normal), ₹3500 (Tatkaal)'
            },
            procurementGuideOffline: {
                steps: [
                    { stepNumber: 1, description: 'Visit Passport Seva Kendra (PSK)' },
                    { stepNumber: 2, description: 'Police verification at local station' }
                ],
                officeType: 'Passport Office',
                processingTime: '30 days typically',
                fees: 'Included in online payment'
            }
        },
        {
            documentName: 'Ration Card',
            documentCode: 'RATION_CARD',
            category: DocumentCategory.IDENTITY,
            description: 'Entitlement to subsidized food grains.',
            stateSpecific: true,
            procurementGuideOnline: {
                steps: [
                    { stepNumber: 1, description: 'Visit State Food & Civil Supplies portal' }
                ],
                processingTime: '30 days',
                fees: '₹10-50'
            },
            procurementGuideOffline: {
                steps: [
                    { stepNumber: 1, description: 'Visit District Food Supply Office' }
                ],
                officeType: 'District Food Supply Office',
                processingTime: '30-45 days',
                fees: '₹0-50'
            }
        },
        {
            documentName: 'Birth Certificate',
            documentCode: 'BIRTH_CERT',
            category: DocumentCategory.IDENTITY,
            description: 'Official record of a person\'s birth.',
            procurementGuideOnline: {
                steps: [
                    { stepNumber: 1, description: 'Visit CRSORG portal or Municipal portal' }
                ],
                processingTime: '7-14 days',
                fees: '₹0-20'
            },
            procurementGuideOffline: {
                steps: [
                    { stepNumber: 1, description: 'Visit Municipal Corporation or Gram Panchayat' }
                ],
                officeType: 'Municipal Office',
                processingTime: '15 days',
                fees: '₹0-20'
            }
        },
        {
            documentName: 'School ID Card',
            documentCode: 'SCHOOL_ID',
            category: DocumentCategory.IDENTITY,
            description: 'Identification issued by the school.',
            isCommon: false
        },
        {
            documentName: 'Employer ID Card',
            documentCode: 'EMPLOYER_ID',
            category: DocumentCategory.IDENTITY,
            description: 'Identification issued by the employer.'
        },
        {
            documentName: 'Bank Passbook',
            documentCode: 'BANK_PASSBOOK',
            category: DocumentCategory.IDENTITY,
            description: 'Bank passbook used as identity/address proof in some cases.'
        },

        // INCOME DOCUMENTS (8)
        {
            documentName: 'Income Certificate',
            documentCode: 'INCOME_CERT',
            category: DocumentCategory.INCOME,
            description: 'Proof of annual income of a family.',
            isCommon: true,
            procurementGuideOnline: {
                steps: [
                    { stepNumber: 1, description: 'Visit State e-District portal' }
                ],
                processingTime: '7-15 days',
                fees: '₹20-50'
            },
            procurementGuideOffline: {
                steps: [
                    { stepNumber: 1, description: 'Visit Tehsil / Taluka office' }
                ],
                officeType: 'Tehsil Office',
                processingTime: '15 days',
                fees: '₹20'
            }
        },
        { documentName: 'Salary Slips', documentCode: 'SALARY_SLIPS', category: DocumentCategory.INCOME, description: 'Last 3 months salary slips.' },
        { documentName: 'Form 16', documentCode: 'FORM_16', category: DocumentCategory.INCOME, description: 'TDS certificate issued by employer.' },
        { documentName: 'ITR (Income Tax Return)', documentCode: 'ITR', category: DocumentCategory.INCOME, description: 'Acknowledgment of tax return filing.' },
        { documentName: 'Agricultural Income Certificate', documentCode: 'AGRI_INCOME_CERT', category: DocumentCategory.INCOME, description: 'Proof of income from farming activities.' },
        { documentName: 'Business Income Certificate', documentCode: 'BIZ_INCOME_CERT', category: DocumentCategory.INCOME, description: 'Certified by CA for business owners.' },
        { documentName: 'Pension Certificate', documentCode: 'PENSION_CERT', category: DocumentCategory.INCOME, description: 'Proof of pension for senior citizens.' },
        { documentName: 'Affidavit for Non-Income', documentCode: 'NON_INCOME_AFFIDAVIT', category: DocumentCategory.INCOME, description: 'Declaration for individuals without formal income.' },

        // CASTE DOCUMENTS (5)
        {
            documentName: 'Caste Certificate (SC)',
            documentCode: 'CASTE_SC',
            category: DocumentCategory.CASTE,
            description: 'Official proof of belonging to SC category.',
            procurementGuideOffline: { steps: [{ stepNumber: 1, description: 'Visit Tehsil office' }], officeType: 'Tehsil Office', processingTime: '15-30 days', fees: '₹30' }
        },
        { documentName: 'Caste Certificate (ST)', documentCode: 'CASTE_ST', category: DocumentCategory.CASTE, description: 'Official proof of belonging to ST category.' },
        { documentName: 'Caste Certificate (OBC)', documentCode: 'CASTE_OBC', category: DocumentCategory.CASTE, description: 'Official proof of belonging to OBC category.' },
        { documentName: 'Non-Creamy Layer Certificate (OBC)', documentCode: 'OBC_NCL', category: DocumentCategory.CASTE, description: 'Required for OBC reservation benefits.' },
        { documentName: 'EWS Certificate', documentCode: 'EWS_CERT', category: DocumentCategory.CASTE, description: 'Economically Weaker Section certificate.' },

        // ADDRESS DOCUMENTS (5)
        {
            documentName: 'Domicile Certificate',
            documentCode: 'DOMICILE',
            category: DocumentCategory.ADDRESS,
            description: 'Proof of residence in a particular state.',
            isCommon: true,
            procurementGuideOnline: { steps: [{ stepNumber: 1, description: 'State e-District portal' }], processingTime: '15 days', fees: '₹50' }
        },
        { documentName: 'Residence Certificate', documentCode: 'RESIDENCE_CERT', category: DocumentCategory.ADDRESS, description: 'Proof of current address.' },
        { documentName: 'Electricity Bill', documentCode: 'ELECTRICITY_BILL', category: DocumentCategory.ADDRESS, description: 'Bill from last 2 months.' },
        { documentName: 'Water Bill', documentCode: 'WATER_BILL', category: DocumentCategory.ADDRESS, description: 'Bill from last 2 months.' },
        { documentName: 'Rent Agreement', documentCode: 'RENT_AGREEMENT', category: DocumentCategory.ADDRESS, description: 'Notarized rent agreement.' },

        // EDUCATION DOCUMENTS (12)
        { documentName: 'Class 10th Mark Sheet', documentCode: 'CLASS_10_MARKS', category: DocumentCategory.EDUCATION },
        { documentName: 'Class 10th Certificate', documentCode: 'CLASS_10_CERT', category: DocumentCategory.EDUCATION },
        { documentName: 'Class 12th Mark Sheet', documentCode: 'CLASS_12_MARKS', category: DocumentCategory.EDUCATION },
        { documentName: 'Class 12th Certificate', documentCode: 'CLASS_12_CERT', category: DocumentCategory.EDUCATION },
        { documentName: 'Graduation Degree', documentCode: 'GRAD_DEGREE', category: DocumentCategory.EDUCATION },
        { documentName: 'Graduation Mark Sheets', documentCode: 'GRAD_MARKS', category: DocumentCategory.EDUCATION },
        { documentName: 'Post-Graduation Degree', documentCode: 'PG_DEGREE', category: DocumentCategory.EDUCATION },
        { documentName: 'Post-Graduation Mark Sheets', documentCode: 'PG_MARKS', category: DocumentCategory.EDUCATION },
        { documentName: 'School Leaving Certificate / TC', documentCode: 'SLC_TC', category: DocumentCategory.EDUCATION },
        { documentName: 'Migration Certificate', documentCode: 'MIGRATION_CERT', category: DocumentCategory.EDUCATION },
        { documentName: 'Bonafide Certificate', documentCode: 'BONAFIDE_CERT', category: DocumentCategory.EDUCATION },
        { documentName: 'Gap Certificate', documentCode: 'GAP_CERT', category: DocumentCategory.EDUCATION },

        // BANK DOCUMENTS (3)
        { documentName: 'Bank Account Passbook (First Page)', documentCode: 'BANK_PASSBOOK_FRONT', category: DocumentCategory.BANK },
        { documentName: 'Cancelled Cheque', documentCode: 'CANCELLED_CHEQUE', category: DocumentCategory.BANK },
        { documentName: 'Bank Account Statement', documentCode: 'BANK_STATEMENT', category: DocumentCategory.BANK },

        // AGRICULTURAL DOCUMENTS (5)
        { documentName: 'Land Records (7/12 Extract)', documentCode: 'LAND_7_12', category: DocumentCategory.AGRICULTURAL, stateSpecific: true },
        { documentName: 'Khasra / Khatauni', documentCode: 'KHASRA', category: DocumentCategory.AGRICULTURAL, stateSpecific: true },
        { documentName: 'Patta / Chitta', documentCode: 'PATTA', category: DocumentCategory.AGRICULTURAL, stateSpecific: true },
        { documentName: 'Farmer Registration Card', documentCode: 'FARMER_ID', category: DocumentCategory.AGRICULTURAL },
        { documentName: 'Crop Insurance Documents', documentCode: 'CROP_INSURANCE', category: DocumentCategory.AGRICULTURAL },

        // DISABILITY DOCUMENTS (2)
        { documentName: 'Disability Certificate (40%+)', documentCode: 'DISABILITY_CERT', category: DocumentCategory.DISABILITY },
        { documentName: 'UDID Card', documentCode: 'UDID', category: DocumentCategory.DISABILITY }
    ]

    for (const doc of documents) {
        await prisma.masterDocument.upsert({
            where: { documentCode: doc.documentCode },
            update: doc,
            create: doc as any
        })
    }

    console.log('Seeding Document Office Addresses...')
    const states = ['Maharashtra', 'Tamil Nadu', 'Uttar Pradesh', 'Karnataka', 'Gujarat']
    const certificates = ['INCOME_CERT', 'CASTE_SC', 'DOMICILE']

    for (const stateName of states) {
        for (const certCode of certificates) {
            const doc = await prisma.masterDocument.findUnique({ where: { documentCode: certCode } })
            if (!doc) continue

            await prisma.documentOfficeAddress.create({
                data: {
                    documentId: doc.id,
                    state: stateName,
                    officeType: certCode === 'DOMICILE' ? 'District Collectorate' : 'Tehsil Office',
                    officeName: `${stateName} State Services Center`,
                    address: `Main Street, City Center, ${stateName}`,
                    contactNumber: '022-22020202',
                    officeHours: '10 AM - 5 PM, Mon-Fri'
                }
            })
        }
    }

    console.log('Seed completed successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
