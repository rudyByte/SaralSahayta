import Groq from "groq-sdk";

export const GROQ_MODEL = "llama-3.3-70b-versatile"; // High performance, large context

export function getGroqClient(): Groq {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("Missing GROQ_API_KEY environment variable");
    }
    return new Groq({
        apiKey: process.env.GROQ_API_KEY,
    });
}
