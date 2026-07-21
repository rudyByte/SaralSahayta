export interface ValidationCheck {
  title: string;
  passed: boolean;
}

export interface DocumentValidationResult {
  status: "success" | "warning" | "error";
  score: number;
  checks: ValidationCheck[];
}

/**
 * Mocks an AI validation process for uploaded documents.
 * 
 * Future implementation: Send file to backend / Groq / OpenAI
 * to perform real OCR, blur detection, and classification.
 */
export async function analyzeDocumentQuality(docData: any): Promise<DocumentValidationResult> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  return {
    status: "success",
    score: 92,
    checks: [
      { title: "Readable", passed: true },
      { title: "High OCR confidence", passed: true },
      { title: "Proper resolution", passed: true },
      { title: "Expired", passed: false }
    ]
  };
}
