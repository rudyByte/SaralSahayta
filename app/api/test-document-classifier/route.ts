import { NextResponse } from 'next/server';
import { classifyDocument } from '@/lib/documents/groq-document-classifier';

export async function GET() {
  const sampleOcrText = `
    Government of India
    Aadhaar
    Name: John Doe
    DOB: 01/01/1990
    Gender: Male
    UIDAI: 1234 5678 9012
    Address: 123, Main Street, Delhi, India
  `;

  try {
    const result = await classifyDocument(sampleOcrText, 'Aadhaar Card');
    
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Error in test-document-classifier endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An error occurred during classification'
    }, { status: 500 });
  }
}
