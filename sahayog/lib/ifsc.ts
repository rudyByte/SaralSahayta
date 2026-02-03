export interface BankInfo {
    bankName: string;
    branch: string;
    valid: boolean;
}

export const validateIFSC = async (ifsc: string): Promise<BankInfo> => {
    if (!ifsc || ifsc.length !== 11) {
        return { bankName: "", branch: "", valid: false };
    }

    try {
        const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
        if (!response.ok) {
            return { bankName: "", branch: "", valid: false };
        }

        const data = await response.json();
        return {
            bankName: data.BANK || "",
            branch: data.BRANCH || "",
            valid: true,
        };
    } catch (error) {
        console.error("IFSC API Error:", error);
        return { bankName: "", branch: "", valid: false };
    }
};
