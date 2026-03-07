/**
 * Document-specific parsers to extract structured data from OCR text
 */

export interface AadhaarData {
    aadhaarNumber: string | null;
    name: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    address: string | null;
}

export interface PANData {
    panNumber: string | null;
    name: string | null;
    dateOfBirth: string | null;
    fatherName: string | null;
}

export interface IncomeCertificateData {
    certificateNumber: string | null;
    annualIncome: number | null;
    issueDate: string | null;
    validUntil: string | null;
    applicantName: string | null;
}

export interface EducationDocumentData {
    studentName: string | null;
    rollNumber: string | null;
    marks: string | null;
    percentage: string | null;
    grade: string | null;
    yearOfPassing: string | null;
    board: string | null;
}

/**
 * Parse Aadhaar card data from OCR text
 */
export function parseAadhaarData(ocrText: string): AadhaarData {
    const text = ocrText.replace(/\s+/g, ' ').trim();

    return {
        aadhaarNumber: extractAadhaarNumber(text),
        name: extractName(text, 'aadhaar'),
        dateOfBirth: extractDateOfBirth(text),
        gender: extractGender(text),
        address: extractAddress(text)
    };
}

function extractAadhaarNumber(text: string): string | null {
    // Pattern: 1234 5678 9012 or 123456789012
    const pattern = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
    const match = text.match(pattern);

    if (match) {
        return match[0].replace(/\s/g, '');
    }

    return null;
}

function extractName(text: string, docType: string): string | null {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    if (docType === 'aadhaar') {
        // Name is usually 2nd or 3rd line in Aadhaar
        for (let i = 1; i < Math.min(lines.length, 5); i++) {
            const line = lines[i];
            // Name should be 2+ words, all alphabets, 3-50 chars
            if (/^[A-Za-z]+(\s[A-Za-z]+)+$/.test(line) &&
                line.length >= 3 && line.length <= 50) {
                return line;
            }
        }
    } else if (docType === 'pan') {
        // In PAN, name is usually the line above PAN number
        const panIndex = lines.findIndex(l => /[A-Z]{5}\d{4}[A-Z]/.test(l));
        if (panIndex > 0) {
            return lines[panIndex - 1];
        }
    }

    return null;
}

function extractDateOfBirth(text: string): string | null {
    // Patterns: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const patterns = [
        /\b(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})\b/,
        /DOB[:\s]+(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/i,
        /Birth[:\s]+(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const [_, day, month, year] = match;
            return `${day}/${month}/${year}`;
        }
    }

    return null;
}

function extractGender(text: string): string | null {
    const malePattern = /\bMALE\b/i;
    const femalePattern = /\bFEMALE\b/i;

    if (malePattern.test(text) && !femalePattern.test(text)) {
        return 'Male';
    }
    if (femalePattern.test(text) && !malePattern.test(text)) {
        return 'Female';
    }

    return null;
}

function extractAddress(text: string): string | null {
    const addressKeywords = ['Address', 'S/O', 'C/O', 'D/O'];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const keyword of addressKeywords) {
            if (line.includes(keyword)) {
                const addressLines = lines.slice(i, i + 5);
                const address = addressLines.join(', ');

                return address
                    .replace(/Address[:\s]*/i, '')
                    .replace(/S\/O[:\s]*/i, '')
                    .replace(/C\/O[:\s]*/i, '')
                    .replace(/D\/O[:\s]*/i, '')
                    .trim();
            }
        }
    }

    return null;
}

/**
 * Parse PAN card data from OCR text
 */
export function parsePANData(ocrText: string): PANData {
    const text = ocrText.replace(/\s+/g, ' ').trim();

    return {
        panNumber: extractPANNumber(text),
        name: extractName(text, 'pan'),
        dateOfBirth: extractDateOfBirth(text),
        fatherName: extractFatherName(text)
    };
}

function extractPANNumber(text: string): string | null {
    const pattern = /\b[A-Z]{5}\d{4}[A-Z]\b/;
    const match = text.match(pattern);
    return match ? match[0] : null;
}

function extractFatherName(text: string): string | null {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
        if (line.includes("Father") || line.includes("FATHER")) {
            const nameMatch = line.match(/Father['']?s?\s*Name[:\s]+(.+)/i);
            if (nameMatch) {
                return nameMatch[1].trim();
            }
        }
    }

    return null;
}

/**
 * Parse Income Certificate data from OCR text
 */
export function parseIncomeCertificateData(ocrText: string): IncomeCertificateData {
    const text = ocrText.replace(/\s+/g, ' ').trim();

    return {
        certificateNumber: extractCertificateNumber(text),
        annualIncome: extractAnnualIncome(text),
        issueDate: extractIssueDate(text),
        validUntil: null,
        applicantName: extractApplicantName(text)
    };
}

function extractCertificateNumber(text: string): string | null {
    const patterns = [
        /\b[A-Z]{2,4}[\/\-]\d{4}[\/\-]\d{4,6}\b/,
        /Certificate\s+No[.:]?\s*([A-Z0-9\/\-]{8,})/i,
        /Cert\s+No[.:]?\s*([A-Z0-9\/\-]{8,})/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1] || match[0];
        }
    }

    return null;
}

function extractAnnualIncome(text: string): number | null {
    const patterns = [
        /(?:Rs\.?|₹)\s?(\d{1,3}(?:,?\d{3})*)/i,
        /Income[:\s]+(?:Rs\.?|₹)?\s?(\d{1,3}(?:,?\d{3})*)/i,
        /Annual[:\s]+(?:Rs\.?|₹)?\s?(\d{1,3}(?:,?\d{3})*)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const numberStr = match[1].replace(/,/g, '');
            const income = parseInt(numberStr, 10);

            if (income >= 1000 && income <= 10000000) {
                return income;
            }
        }
    }

    return null;
}

function extractIssueDate(text: string): string | null {
    const patterns = [
        /Issue(?:d)?\s*Date[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
        /Date[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
        /Dated[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}

function extractApplicantName(text: string): string | null {
    const patterns = [
        /Name[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/i,
        /Applicant[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }

    return null;
}

/**
 * Parse educational document (marksheet, certificate)
 */
export function parseEducationDocumentData(ocrText: string): EducationDocumentData {
    const text = ocrText.replace(/\s+/g, ' ').trim();

    return {
        studentName: extractStudentName(text),
        rollNumber: extractRollNumber(text),
        marks: extractMarks(text),
        percentage: extractPercentage(text),
        grade: extractGrade(text),
        yearOfPassing: extractYearOfPassing(text),
        board: extractBoard(text)
    };
}

function extractStudentName(text: string): string | null {
    const patterns = [
        /Student['\s]*Name[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/i,
        /Name[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }

    return null;
}

function extractRollNumber(text: string): string | null {
    const patterns = [
        /Roll\s+No[.:]?\s*([A-Z0-9]{6,})/i,
        /Roll[:\s]+([A-Z0-9]{6,})/i,
        /Enrollment[:\s]+([A-Z0-9]{6,})/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }

    return null;
}

function extractMarks(text: string): string | null {
    const pattern = /Marks[:\s]+(\d+)(?:\s*\/\s*(\d+))?/i;
    const match = text.match(pattern);

    if (match) {
        return match[2] ? `${match[1]}/${match[2]}` : match[1];
    }

    return null;
}

function extractPercentage(text: string): string | null {
    const pattern = /(\d{1,3}\.\d{1,2})%|Percentage[:\s]+(\d{1,3}\.\d{1,2})/i;
    const match = text.match(pattern);

    if (match) {
        return (match[1] || match[2]) + '%';
    }

    return null;
}

function extractGrade(text: string): string | null {
    const pattern = /Grade[:\s]+([A-F][+\-]?)|CGPA[:\s]+(\d\.\d+)/i;
    const match = text.match(pattern);

    if (match) {
        return match[1] || match[2];
    }

    return null;
}

function extractYearOfPassing(text: string): string | null {
    const pattern = /(?:Year|Passing)[:\s]+(19\d{2}|20\d{2})/i;
    const match = text.match(pattern);

    if (match) {
        return match[1];
    }

    const yearPattern = /\b(19[89]\d|20[0-3]\d)\b/;
    const yearMatch = text.match(yearPattern);

    return yearMatch ? yearMatch[1] : null;
}

function extractBoard(text: string): string | null {
    const boards = [
        'CBSE', 'ICSE', 'State Board', 'Maharashtra Board',
        'UP Board', 'Karnataka Board', 'Tamil Nadu Board'
    ];

    for (const board of boards) {
        if (text.includes(board)) {
            return board;
        }
    }

    return null;
}

/**
 * Auto-detect document type from OCR text
 */
export function detectDocumentType(ocrText: string): string {
    const text = ocrText.toLowerCase();

    if (text.includes('aadhaar') || text.includes('uidai') || /\d{4}\s\d{4}\s\d{4}/.test(ocrText)) {
        return 'AADHAAR';
    }

    if (text.includes('permanent account number') || text.includes('income tax') || /[A-Z]{5}\d{4}[A-Z]/.test(ocrText)) {
        return 'PAN';
    }

    if (text.includes('income certificate') || text.includes('annual income')) {
        return 'INCOME_CERT';
    }

    if (text.includes('caste certificate') || text.includes('scheduled caste') || text.includes('scheduled tribe')) {
        return 'CASTE_CERT';
    }

    if (text.includes('marksheet') || text.includes('marks obtained') || text.includes('percentage')) {
        return 'EDUCATION';
    }

    return 'UNKNOWN';
}
