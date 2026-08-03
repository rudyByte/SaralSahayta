import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai/groq";

export async function GET() {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "API Key not found",
      });
    }

    const responseText = await generateText("Reply with exactly: Groq Connected Successfully");

    return NextResponse.json({
      success: true,
      response: responseText,
    });
  } catch (e: any) {
    const errorMessage = e?.message || 'Unknown error';

    console.error("Groq API Error in /api/test-groq:", errorMessage);

    return NextResponse.json({
      success: false,
      error: errorMessage,
    });
  }
}
