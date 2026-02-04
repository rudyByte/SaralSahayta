export interface IFSCResponse {
    BRANCH: string;
    CENTRE: string;
    DISTRICT: string;
    STATE: string;
    ADDRESS: string;
    CONTACT: string;
    IMPS: boolean;
    CITY: string;
    UPI: boolean;
    MICR: string;
    RTGS: boolean;
    NEFT: boolean;
    SWIFT: string;
    ISO3166: string;
    BANK: string;
    BANKCODE: string;
    IFSC: string;
}

export type ValidateIFSCResult = {
    valid: boolean;
    bankName?: string;
    branch?: string;
    error?: string;
};

// Cache to store validated IFSC codes to avoid repeated API calls
const ifscCache = new Map<string, ValidateIFSCResult>();

export async function validateIFSC(code: string): Promise<ValidateIFSCResult> {
    const cleanCode = code.toUpperCase().trim();

    // Regex validation: 4 letters, 0, 6 alphanumeric
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    if (!ifscRegex.test(cleanCode)) {
        return { valid: false, error: 'Invalid IFSC format. Must be 11 characters, starting with 4 letters, then 0, ending with 6 alphanumeric.' };
    }

    // Check cache
    if (ifscCache.has(cleanCode)) {
        return ifscCache.get(cleanCode)!;
    }

    try {
        const response = await fetch(`https://ifsc.razorpay.com/${cleanCode}`);

        if (!response.ok) {
            const result = { valid: false, error: 'IFSC code not found.' };
            ifscCache.set(cleanCode, result);
            return result;
        }

        const data: IFSCResponse = await response.json();

        const result = {
            valid: true,
            bankName: data.BANK,
            branch: data.BRANCH
        };

        ifscCache.set(cleanCode, result);
        return result;

    } catch (error) {
        return { valid: false, error: 'Failed to validate IFSC code. Please try again.' };
    }
}
