import Groq from 'groq-sdk';

export const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";
export const GROQ_VISION_MODEL = "llama-3.2-90b-vision-preview"; // Use correct vision model

// Create a singleton Groq client
export const getGroqClient = () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GROQ_API_KEY environment variable");
    }
    
    // We pass a custom fetch to avoid the node-fetch "Premature close" bug
    return new Groq({ 
        apiKey,
        dangerouslyAllowBrowser: true, // If it runs in Next.js edge/client sometimes
        fetch: (url, init) => {
            // Force using Next.js global fetch instead of the SDK's node-fetch polyfill
            return fetch(url, init);
        }
    });
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
