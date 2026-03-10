/**
 * Utility to calculate document expiry dates based on document type and issue date.
 */

export type DocumentType =
    | 'income_certificate'
    | 'caste_certificate'
    | 'aadhaar_card'
    | 'pan_card'
    | 'voter_id'
    | 'ration_card'
    | 'domicile_certificate'
    | 'other';

/**
 * Calculates the expiry date for a given document type.
 * 
 * Rules:
 * - Income Certificate: Valid for 1 year from issue date.
 * - Caste Certificate: Valid for 3 years from issue date.
 * - Domicile Certificate: Valid for 3 years from issue date.
 * - Aadhaar/PAN/Voter/Ration: Permanent (returns null).
 * 
 * @param docType - The type of document.
 * @param issueDate - The date the document was issued.
 * @returns The expiry Date object, or null if the document does not expire.
 */
export function calculateExpiryDate(docType: string, issueDate: Date | string): Date | null {
    const date = new Date(issueDate);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid issue date provided');
    }

    // Normalize docType to lowercase for comparison
    const type = docType.toLowerCase();

    if (type.includes('income')) {
        // Income Certificate: +1 year
        const expiryDate = new Date(date);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        return expiryDate;
    }

    if (type.includes('caste')) {
        // Caste Certificate: +3 years
        const expiryDate = new Date(date);
        expiryDate.setFullYear(expiryDate.getFullYear() + 3);
        return expiryDate;
    }

    if (type.includes('domicile')) {
        // Domicile Certificate: +3 years
        const expiryDate = new Date(date);
        expiryDate.setFullYear(expiryDate.getFullYear() + 3);
        return expiryDate;
    }

    // Permanent documents
    if (
        type.includes('aadhaar') ||
        type.includes('pan') ||
        type.includes('voter') ||
        type.includes('ration')
    ) {
        return null;
    }

    // Default: check if it's a known time-sensitive type, else null
    return null;
}

/**
 * Checks if a document is expired based on its expiry date.
 * 
 * @param expiryDate - The expiry date to check.
 * @returns True if the document is expired, false otherwise.
 */
export function isDocumentExpired(expiryDate: Date | string | null): boolean {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
}

/**
 * Determines the status of a document based on its expiry date.
 * 
 * @param expiryDate - The expiry date to check.
 * @returns 'EXPIRED', 'EXPIRING_SOON', or 'ACTIVE'.
 */
export function getDocumentExpiryStatus(expiryDate: Date | string | null): 'EXPIRED' | 'EXPIRING_SOON' | 'ACTIVE' {
    if (!expiryDate) return 'ACTIVE';

    const expiry = new Date(expiryDate);
    const now = new Date();

    if (expiry < now) return 'EXPIRED';

    // Expiring soon: within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    if (expiry <= thirtyDaysFromNow) return 'EXPIRING_SOON';

    return 'ACTIVE';
}
