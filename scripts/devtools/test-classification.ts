import { classifyDocument } from '../../lib/documents/groq-document-classifier';

async function test() {
    const aadhaarText = 'Government of India, Aadhaar, UIDAI, 1234 5678 9012, Name: John Doe';
    const result = await classifyDocument(aadhaarText, 'Bank Passbook');
    console.log(result);
}

test();
