/**
 * Masks sensitive strings (e.g., Aadhaar, Account Number, PAN)
 * Shows only the last 4 digits by default.
 */
export function maskSensitiveData(text: string | null | undefined, visibleDigits = 4): string {
    if (!text) return '-';
    if (text.length <= visibleDigits) return text;
    
    const maskedLength = text.length - visibleDigits;
    // For standard formats (12 digits), we want XXXXXXXX1234
    return 'X'.repeat(maskedLength) + text.slice(-visibleDigits);
}
