"use server";

import { groq, GROQ_MODEL } from "@/lib/ai/groq";
import { Scheme, Gender, Category, Education } from "@prisma/client";

interface AIAnalysisResult {
    summary: string;
    recommendation: string;
    topSchemes: string[]; // IDs
    missingData?: string[];
}

export async function analyzeSchemesForUser(
    userProfile: any,
    availableSchemes: Scheme[]
): Promise<AIAnalysisResult | null> {
    try {
        // 1. Prepare context for AI
        const profileContext = `
User Profile:
- Gender: ${userProfile.gender}
- Category: ${userProfile.category}
- State: ${userProfile.state}
- Annual Income: ₹${userProfile.annualIncome?.toLocaleString() || "Not provided"}
- Education: ${userProfile.education || "Not provided"}
- Occupation: ${userProfile.occupation || "Not provided"}
- Age: ${userProfile.age || "Not provided"}
    `.trim();

        const schemesContext = availableSchemes
            .slice(0, 5) // Send top 5 to avoid token limits
            .map(s => `ID: ${s.id}, Name: ${s.name}, Description: ${s.description.substring(0, 150)}...`)
            .join("\n\n");

        const prompt = `
You are an expert Government Scheme Consultant in India. 
Based on the user's profile below, analyze the available schemes and provide a personalized recommendation summary.

${profileContext}

Available Schemes:
${schemesContext}

Please provide:
1. A brief summary of the user's eligibility landscape.
2. Which scheme is the best fit and why.
3. A list of scheme IDs that are most relevant.

Format your response as a JSON object:
{
  "summary": "...",
  "recommendation": "...",
  "topSchemes": ["id1", "id2"],
  "missingData": ["data1", "data2"]
}
    `.trim();

        // 2. Call Groq
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that analyzes government scheme eligibility. Always respond in valid JSON format.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: GROQ_MODEL,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return null;

        return JSON.parse(content) as AIAnalysisResult;
    } catch (error) {
        console.error("❌ AI Analysis Error:", error);
        return null;
    }
}
