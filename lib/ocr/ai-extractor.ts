import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export interface ExtractedDocumentData {
    name?: string;
    aadhaarNumber?: string;
    panNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    fatherName?: string;
    annualIncome?: number;
    issueDate?: string;
    certificateNumber?: string;
}

/**
 * AI-powered document extraction using Groq Vision
 */
export async function extractDataWithAI(
    imageBase64: string,
    documentType: string
): Promise<{ data: ExtractedDocumentData; confidence: number; text?: string }> {
    try {
        const prompt = getPromptForDocument(documentType);

        const response = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${imageBase64}`,
                            },
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.1, // High precision
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No response from AI extraction");
        }

        const parsed = JSON.parse(content);

        return {
            data: parsed,
            confidence: 95, // AI extraction is generally high confidence if it returns valid JSON
            text: content // Original JSON response for debugging
        };
    } catch (error: any) {
        console.error("AI Extraction Error:", error);
        throw new Error(`AI Extraction failed: ${error.message}`);
    }
}

function getPromptForDocument(type: string): string {
    const basePrompt = "You are a professional Indian document parser. " +
        "Extract fields from the image into a JSON object. " +
        "CRITICAL: DO NOT extract any tagline, slogan, or footer text. " +
        "Example of WHAT NOT TO EXTRACT: 'Aadhaar - Aadmi Ka Adhikar', 'Mera Aadhaar Meri Pehchan', etc. " +
        "The NAME is usually located near the photo or at the top center, often in both English and Hindi. " +
        "Only return valid JSON. If a field is missing, use null.";

    switch (type.toUpperCase()) {
        case 'AADHAAR':
            return `${basePrompt} Return JSON: { "name": string, "aadhaarNumber": string, "dateOfBirth": string, "gender": string, "address": string }. Note: Aadhaar name is NOT the tagline at the bottom.`;
        case 'PAN':
            return `${basePrompt} Return JSON: { "name": string, "panNumber": string, "fatherName": string, "dateOfBirth": string }`;
        default:
            return `${basePrompt} Return a JSON object with all identifying information found.`;
    }
}
