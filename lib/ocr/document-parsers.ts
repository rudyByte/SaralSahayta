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
    // Text is already flattened to single line by preprocessing
    // Try labeled patterns first (most reliable)
    const labelPatterns = [
        // "Name: John Doe" or "Name / नाम: John Doe"
        /(?:^|\s)Name[:\s]+([A-Za-z][A-Za-z\s]{1,48}[A-Za-z])/i,
        // Hindi label
        /(?:^|\s)नाम[:\s]*([\u0900-\u097F][\u0900-\u097F\s]{1,48}[\u0900-\u097F])/,
        // "Name / नाम: John" mixed
        /Name[\s/]*नाम[:\s]*([A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F\s]{1,48}[A-Za-z\u0900-\u097F])/i,
        // "Name of Applicant: John Doe"
        /Name\s+of\s+(?:Applicant|Student|Candidate)[:\s]+([A-Za-z][A-Za-z\s]{1,48}[A-Za-z])/i,
    ];

    for (const pattern of labelPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const name = match[1].trim();
            if (name.length >= 3 && name.length <= 50) {
                return name;
            }
        }
    }

    // For Aadhaar: name is typically between Aadhaar number and DOB/Gender
    if (docType === 'aadhaar') {
        // Try to find name between Aadhaar number and DOB
        const afterNumber = text.replace(/.*\d{4}\s?\d{4}\s?\d{4}/, '').trim();
        const beforeDOB = afterNumber.split(/DOB|जन्म|Date of Birth|Birth|Gender|Male|Female|लिंग/i)[0].trim();
        // Clean up and find the name part
        const cleaned = beforeDOB.replace(/[|:,\-]+/g, ' ').trim();
        const words = cleaned.split(/\s+/).filter(w => /^[A-Za-z\u0900-\u097F]+$/.test(w) && w.length >= 2);
        if (words.length >= 2 && words.length <= 5) {
            return words.join(' ');
        }

        // Fallback: look for name before DOB in the full text
        const dobIndex = text.search(/DOB|जन्म तिथि|Date of Birth|Gender|Male|Female|लिंग/i);
        if (dobIndex > 0) {
            const beforeDob = text.substring(0, dobIndex).trim();
            const nameMatch = beforeDob.match(/([A-Za-z][A-Za-z]+(?:\s[A-Za-z][A-Za-z]+)+)\s*$/);
            if (nameMatch) return nameMatch[1];
        }
    }

    if (docType === 'pan') {
        // In PAN, name is usually the line above PAN number
        const panMatch = text.match(/([A-Z][A-Z\s]+[A-Z])\s*[A-Z]{5}\d{4}[A-Z]/);
        if (panMatch) {
            return panMatch[1].trim();
        }
    }

    return null;
}

function extractDateOfBirth(text: string): string | null {
    // Patterns ordered from most specific to most generic
    const patterns = [
        // Labeled patterns: DOB, Date of Birth, Birth, जन्म तिथि
        /DOB[:\s]*(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/i,
        /Date\s+of\s+Birth[:\s]*(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/i,
        /Birth[:\s]*(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/i,
        /जन्म\s*तिथि[:\s]*(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/,
        /जन्म[:\s]*(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/,
        // Generic date near DOB label (handles OCR spacing issues)
        /DOB[^0-9]*(\d{2})\s*[\/\-\.]\s*(\d{2})\s*[\/\-\.]\s*(\d{4})/i,
        // Standalone date format (most common Indian date formats)
        /\b(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})\b/
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const [_, day, month, year] = match;
            // Validate the date is reasonable
            const y = parseInt(year);
            const m = parseInt(month);
            const d = parseInt(day);
            if (y >= 1900 && y <= 2020 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                return `${day}/${month}/${year}`;
            }
        }
    }

    return null;
}

function extractGender(text: string): string | null {
    // Check labeled patterns first
    if (/Gender[:\s]+Male/i.test(text) || /Sex[:\s]+Male/i.test(text) || /लिंग[:\s]*पुरुष/i.test(text)) {
        return 'Male';
    }
    if (/Gender[:\s]+Female/i.test(text) || /Sex[:\s]+Female/i.test(text) || /लिंग[:\s]*महिला/i.test(text)) {
        return 'Female';
    }

    // Check for standalone MALE/FEMALE
    const malePattern = /\bMALE\b/i;
    const femalePattern = /\bFEMALE\b/i;

    if (malePattern.test(text) && !femalePattern.test(text)) {
        return 'Male';
    }
    if (femalePattern.test(text) && !malePattern.test(text)) {
        return 'Female';
    }

    // Check for abbreviated forms near gender context
    const genderContext = /(?:gender|sex|लिंग)[^a-zA-Z]*([MF])\b/i;
    const contextMatch = text.match(genderContext);
    if (contextMatch) {
        const letter = contextMatch[1].toUpperCase();
        if (letter === 'M') return 'Male';
        if (letter === 'F') return 'Female';
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

    if (text.includes('aadhaar') || text.includes('uidai') || text.includes('आधार') || text.includes('भारत सरकार') || /\d{4}\s\d{4}\s\d{4}/.test(ocrText)) {
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
