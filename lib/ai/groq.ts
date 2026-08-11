import Groq from 'groq-sdk';

export const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";
export const GROQ_VISION_MODEL = "llama-3.2-90b-vision-preview"; // Use correct vision model

// Create a singleton Groq client — server-side ONLY
export const getGroqClient = () => {
    // Guard: prevent accidental browser-side instantiation which would leak the API key
    if (typeof window !== 'undefined') {
        throw new Error('[Security] Groq client must only be used in server-side code (API routes, server actions). Never call from client components.');
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GROQ_API_KEY environment variable");
    }
    
    return new Groq({ apiKey });
};


export async function generateText(prompt: string): Promise<string> {
    const groq = getGroqClient();
    
    console.log(JSON.stringify({
        event: 'GROQ_REQUEST_START',
        timestamp: new Date().toISOString(),
        model: GROQ_TEXT_MODEL,
        type: 'text'
    }));
    
    const startTime = Date.now();

    try {
        const response = await groq.chat.completions.create({
            model: GROQ_TEXT_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
            response_format: { type: "json_object" }
        });

        const text = response.choices?.[0]?.message?.content;
        
        if (!text) {
            throw new Error("Empty response from Groq");
        }

        console.log(JSON.stringify({
            event: 'GROQ_REQUEST_SUCCESS',
            timestamp: new Date().toISOString(),
            model: GROQ_TEXT_MODEL,
            processingTimeMs: Date.now() - startTime
        }));

        return text;
    } catch (error: any) {
        console.error(JSON.stringify({
            event: 'GROQ_REQUEST_FAILED',
            timestamp: new Date().toISOString(),
            model: GROQ_TEXT_MODEL,
            processingTimeMs: Date.now() - startTime,
            error: error.message,
            stack: error.stack
        }));
        throw error;
    }
}

export async function analyzeImage(prompt: string, imageBase64: string): Promise<string> {
    const groq = getGroqClient();
    
    console.log(JSON.stringify({
        event: 'GROQ_REQUEST_START',
        timestamp: new Date().toISOString(),
        model: GROQ_VISION_MODEL,
        type: 'vision'
    }));
    
    const startTime = Date.now();

    try {
        const response = await groq.chat.completions.create({
            model: GROQ_VISION_MODEL,
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
            temperature: 0.1,
        });

        const text = response.choices?.[0]?.message?.content;
        
        if (!text) {
            throw new Error("Empty response from Groq Vision");
        }

        console.log(JSON.stringify({
            event: 'GROQ_REQUEST_SUCCESS',
            timestamp: new Date().toISOString(),
            model: GROQ_VISION_MODEL,
            processingTimeMs: Date.now() - startTime
        }));

        return text;
    } catch (error: any) {
        console.error(JSON.stringify({
            event: 'GROQ_REQUEST_FAILED',
            timestamp: new Date().toISOString(),
            model: GROQ_VISION_MODEL,
            processingTimeMs: Date.now() - startTime,
            error: error.message,
            stack: error.stack
        }));
        throw error;
    }
}
