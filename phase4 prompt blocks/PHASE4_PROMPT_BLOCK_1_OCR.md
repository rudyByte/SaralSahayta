# PHASE 4 - PROMPT BLOCK 1: OCR DOCUMENT PROCESSING
## Copy this entire block to Antigravity/Cursor

---

## TASK: Implement OCR-based automatic document data extraction

**Context:**
Users upload documents (Aadhaar, PAN, Income Certificate, Educational documents) to Saral Sahayta. We need to automatically extract text and structured data from these images to:
1. Pre-fill application forms (reduce manual typing by 70%)
2. Verify document authenticity
3. Auto-detect document types
4. Improve user experience

**Technology Stack:**
- Primary: Tesseract.js v5+ (client-side, 100% FREE, unlimited)
- Optional Fallback: PaddleOCR (server-side, Railway.app free tier)
- Ultimate Fallback: GPT-4o-mini (only for <5% failed cases, $0.00015/image)

**Expected Time:** 15 hours over 2 days

---

## REQUIREMENTS

### 1. CREATE OCR UTILITY (Client-Side with Tesseract.js)

**File:** `lib/ocr/tesseract-ocr.ts`

```typescript
/**
 * Client-side OCR utility using Tesseract.js
 * Runs in browser - NO server cost, unlimited usage
 */

import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;                // Raw extracted text
  confidence: number;          // 0-100 overall confidence
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
  language: string;
  processingTime: number;      // Milliseconds
}

export interface OCRProgress {
  status: string;
  progress: number;            // 0-1
}

/**
 * Extract text from image using Tesseract OCR
 * @param imageFile - File object from input
 * @param language - Language code: 'eng', 'hin', 'eng+hin'
 * @param onProgress - Optional callback for progress updates
 * @returns OCRResult with extracted text and metadata
 */
export async function extractTextFromImage(
  imageFile: File | Blob,
  language: 'eng' | 'hin' | 'eng+hin' = 'eng',
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  const startTime = Date.now();
  
  try {
    // Initialize Tesseract worker
    const worker = await Tesseract.createWorker(language, 1, {
      logger: (m) => {
        if (onProgress && m.status) {
          onProgress({
            status: m.status,
            progress: m.progress || 0
          });
        }
      }
    });
    
    // Perform OCR
    const { data } = await worker.recognize(imageFile);
    
    // Terminate worker to free memory
    await worker.terminate();
    
    const processingTime = Date.now() - startTime;
    
    return {
      text: data.text,
      confidence: data.confidence,
      words: data.words.map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox
      })),
      language,
      processingTime
    };
    
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error(`OCR failed: ${error.message}`);
  }
}

/**
 * Preprocess image for better OCR accuracy
 * - Resize if too large (>2000px)
 * - Convert to grayscale
 * - Increase contrast
 */
export async function preprocessImage(imageFile: File): Promise<File> {
  // Only preprocess images, not PDFs
  if (imageFile.type === 'application/pdf') {
    return imageFile;
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      // Resize if larger than 2000px
      let width = img.width;
      let height = img.height;
      const maxDim = 2000;
      
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else {
          width = (width / height) * maxDim;
          height = maxDim;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw image
      ctx!.drawImage(img, 0, 0, width, height);
      
      // Convert to grayscale and increase contrast
      const imageData = ctx!.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Grayscale
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        // Increase contrast
        const contrast = ((gray - 128) * 1.2) + 128;
        data[i] = data[i + 1] = data[i + 2] = contrast;
      }
      
      ctx!.putImageData(imageData, 0, 0);
      
      // Convert canvas to File
      canvas.toBlob((blob) => {
        if (blob) {
          const processedFile = new File([blob], imageFile.name, {
            type: 'image/jpeg'
          });
          resolve(processedFile);
        } else {
          reject(new Error('Image preprocessing failed'));
        }
      }, 'image/jpeg', 0.9);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Estimate OCR quality before processing
 * Returns score 0-100
 */
export async function estimateImageQuality(imageFile: File): Promise<{
  score: number;
  issues: string[];
  warnings: string[];
}> {
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;
  
  // Check file size
  if (imageFile.size < 50000) { // Less than 50KB
    warnings.push('File size is small. Image may be low quality.');
    score -= 10;
  }
  
  if (imageFile.size > 10000000) { // Greater than 10MB
    warnings.push('File size is large. Upload may be slow.');
    score -= 5;
  }
  
  // Load image to check dimensions
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      // Check resolution
      if (img.width < 800 || img.height < 600) {
        issues.push('Image resolution too low. Minimum 800x600 required.');
        score -= 30;
      }
      
      // Check aspect ratio (documents are usually portrait or landscape)
      const aspectRatio = img.width / img.height;
      if (aspectRatio < 0.5 || aspectRatio > 2.5) {
        warnings.push('Unusual aspect ratio. Ensure entire document is visible.');
        score -= 10;
      }
      
      resolve({ score, issues, warnings });
    };
    
    img.onerror = () => {
      issues.push('Failed to load image');
      resolve({ score: 0, issues, warnings });
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
}
```

---

### 2. CREATE DOCUMENT PARSERS (Extract Structured Data)

**File:** `lib/ocr/document-parsers.ts`

```typescript
/**
 * Document-specific parsers to extract structured data from OCR text
 */

export interface AadhaarData {
  aadhaarNumber: string | null;
  name: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
}

export interface PANData {
  panNumber: string | null;
  name: string | null;
  dateOfBirth: string | null;
  fatherName: string | null;
}

export interface IncomeCertificateData {
  certificateNumber: string | null;
  annualIncome: number | null;
  issueDate: string | null;
  validUntil: string | null;
  applicantName: string | null;
}

export interface EducationDocumentData {
  studentName: string | null;
  rollNumber: string | null;
  marks: string | null;
  percentage: string | null;
  grade: string | null;
  yearOfPassing: string | null;
  board: string | null;
}

/**
 * Parse Aadhaar card data from OCR text
 */
export function parseAadhaarData(ocrText: string): AadhaarData {
  const text = ocrText.replace(/\s+/g, ' ').trim();
  
  return {
    aadhaarNumber: extractAadhaarNumber(text),
    name: extractName(text, 'aadhaar'),
    dateOfBirth: extractDateOfBirth(text),
    gender: extractGender(text),
    address: extractAddress(text)
  };
}

function extractAadhaarNumber(text: string): string | null {
  // Pattern: 1234 5678 9012 or 123456789012
  const pattern = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
  const match = text.match(pattern);
  
  if (match) {
    return match[0].replace(/\s/g, '');
  }
  
  return null;
}

function extractName(text: string, docType: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  if (docType === 'aadhaar') {
    // Name is usually 2nd or 3rd line in Aadhaar
    // Skip first line (usually "Government of India" or similar)
    for (let i = 1; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      // Name should be 2+ words, all alphabets, 3-50 chars
      if (/^[A-Z][a-z]+(\s[A-Z][a-z]+)+$/.test(line) && 
          line.length >= 3 && line.length <= 50) {
        return line;
      }
    }
  } else if (docType === 'pan') {
    // In PAN, name is usually the line above PAN number
    const panIndex = lines.findIndex(l => /[A-Z]{5}\d{4}[A-Z]/.test(l));
    if (panIndex > 0) {
      return lines[panIndex - 1];
    }
  }
  
  return null;
}

function extractDateOfBirth(text: string): string | null {
  // Patterns: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const patterns = [
    /\b(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})\b/,
    /DOB[:\s]+(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/i,
    /Birth[:\s]+(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const [_, day, month, year] = match;
      return `${day}/${month}/${year}`;
    }
  }
  
  return null;
}

function extractGender(text: string): string | null {
  const malePattern = /\bMALE\b/i;
  const femalePattern = /\bFEMALE\b/i;
  
  if (malePattern.test(text) && !femalePattern.test(text)) {
    return 'Male';
  }
  if (femalePattern.test(text) && !malePattern.test(text)) {
    return 'Female';
  }
  
  return null;
}

function extractAddress(text: string): string | null {
  // Look for address after keywords
  const addressKeywords = ['Address', 'S/O', 'C/O', 'D/O'];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const keyword of addressKeywords) {
      if (line.includes(keyword)) {
        // Collect next 3-5 lines as address
        const addressLines = lines.slice(i, i + 5);
        const address = addressLines.join(', ');
        
        // Clean up
        return address
          .replace(/Address[:\s]*/i, '')
          .replace(/S\/O[:\s]*/i, '')
          .replace(/C\/O[:\s]*/i, '')
          .replace(/D\/O[:\s]*/i, '')
          .trim();
      }
    }
  }
  
  return null;
}

/**
 * Parse PAN card data from OCR text
 */
export function parsePANData(ocrText: string): PANData {
  const text = ocrText.replace(/\s+/g, ' ').trim();
  
  return {
    panNumber: extractPANNumber(text),
    name: extractName(text, 'pan'),
    dateOfBirth: extractDateOfBirth(text),
    fatherName: extractFatherName(text)
  };
}

function extractPANNumber(text: string): string | null {
  // Pattern: ABCDE1234F (5 letters, 4 digits, 1 letter)
  const pattern = /\b[A-Z]{5}\d{4}[A-Z]\b/;
  const match = text.match(pattern);
  
  return match ? match[0] : null;
}

function extractFatherName(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (const line of lines) {
    if (line.includes("Father") || line.includes("FATHER")) {
      // Extract name after "Father's Name:" or similar
      const nameMatch = line.match(/Father['']?s?\s*Name[:\s]+(.+)/i);
      if (nameMatch) {
        return nameMatch[1].trim();
      }
    }
  }
  
  return null;
}

/**
 * Parse Income Certificate data from OCR text
 */
export function parseIncomeCertificateData(ocrText: string): IncomeCertificateData {
  const text = ocrText.replace(/\s+/g, ' ').trim();
  
  return {
    certificateNumber: extractCertificateNumber(text),
    annualIncome: extractAnnualIncome(text),
    issueDate: extractIssueDate(text),
    validUntil: null, // Calculate as issueDate + 1 year
    applicantName: extractApplicantName(text)
  };
}

function extractCertificateNumber(text: string): string | null {
  // Common patterns: IC/2024/12345, CERT-2024-001, etc.
  const patterns = [
    /\b[A-Z]{2,4}[\/\-]\d{4}[\/\-]\d{4,6}\b/,
    /Certificate\s+No[.:]?\s*([A-Z0-9\/\-]{8,})/i,
    /Cert\s+No[.:]?\s*([A-Z0-9\/\-]{8,})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return null;
}

function extractAnnualIncome(text: string): number | null {
  // Patterns: Rs. 200000, ₹2,00,000, Rs 2,00,000/-
  const patterns = [
    /(?:Rs\.?|₹)\s?(\d{1,3}(?:,?\d{3})*)/i,
    /Income[:\s]+(?:Rs\.?|₹)?\s?(\d{1,3}(?:,?\d{3})*)/i,
    /Annual[:\s]+(?:Rs\.?|₹)?\s?(\d{1,3}(?:,?\d{3})*)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const numberStr = match[1].replace(/,/g, '');
      const income = parseInt(numberStr, 10);
      
      // Sanity check: income between 1,000 and 100,00,000
      if (income >= 1000 && income <= 10000000) {
        return income;
      }
    }
  }
  
  return null;
}

function extractIssueDate(text: string): string | null {
  const patterns = [
    /Issue(?:d)?\s*Date[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
    /Date[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
    /Dated[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

function extractApplicantName(text: string): string | null {
  const patterns = [
    /Name[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/i,
    /Applicant[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * Parse educational document (marksheet, certificate)
 */
export function parseEducationDocumentData(ocrText: string): EducationDocumentData {
  const text = ocrText.replace(/\s+/g, ' ').trim();
  
  return {
    studentName: extractStudentName(text),
    rollNumber: extractRollNumber(text),
    marks: extractMarks(text),
    percentage: extractPercentage(text),
    grade: extractGrade(text),
    yearOfPassing: extractYearOfPassing(text),
    board: extractBoard(text)
  };
}

function extractStudentName(text: string): string | null {
  const patterns = [
    /Student['\s]*Name[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/i,
    /Name[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

function extractRollNumber(text: string): string | null {
  const patterns = [
    /Roll\s+No[.:]?\s*([A-Z0-9]{6,})/i,
    /Roll[:\s]+([A-Z0-9]{6,})/i,
    /Enrollment[:\s]+([A-Z0-9]{6,})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

function extractMarks(text: string): string | null {
  const pattern = /Marks[:\s]+(\d+)(?:\s*\/\s*(\d+))?/i;
  const match = text.match(pattern);
  
  if (match) {
    return match[2] ? `${match[1]}/${match[2]}` : match[1];
  }
  
  return null;
}

function extractPercentage(text: string): string | null {
  const pattern = /(\d{1,3}\.\d{1,2})%|Percentage[:\s]+(\d{1,3}\.\d{1,2})/i;
  const match = text.match(pattern);
  
  if (match) {
    return (match[1] || match[2]) + '%';
  }
  
  return null;
}

function extractGrade(text: string): string | null {
  const pattern = /Grade[:\s]+([A-F][+\-]?)|CGPA[:\s]+(\d\.\d+)/i;
  const match = text.match(pattern);
  
  if (match) {
    return match[1] || match[2];
  }
  
  return null;
}

function extractYearOfPassing(text: string): string | null {
  const pattern = /(?:Year|Passing)[:\s]+(19\d{2}|20\d{2})/i;
  const match = text.match(pattern);
  
  if (match) {
    return match[1];
  }
  
  // Fallback: find any 4-digit year between 1980-2030
  const yearPattern = /\b(19[89]\d|20[0-3]\d)\b/;
  const yearMatch = text.match(yearPattern);
  
  return yearMatch ? yearMatch[1] : null;
}

function extractBoard(text: string): string | null {
  const boards = [
    'CBSE', 'ICSE', 'State Board', 'Maharashtra Board', 
    'UP Board', 'Karnataka Board', 'Tamil Nadu Board'
  ];
  
  for (const board of boards) {
    if (text.includes(board)) {
      return board;
    }
  }
  
  return null;
}

/**
 * Auto-detect document type from OCR text
 */
export function detectDocumentType(ocrText: string): string {
  const text = ocrText.toLowerCase();
  
  if (text.includes('aadhaar') || text.includes('uidai') || /\d{4}\s\d{4}\s\d{4}/.test(ocrText)) {
    return 'AADHAAR';
  }
  
  if (text.includes('permanent account number') || text.includes('income tax') || /[A-Z]{5}\d{4}[A-Z]/.test(ocrText)) {
    return 'PAN';
  }
  
  if (text.includes('income certificate') || text.includes('annual income')) {
    return 'INCOME_CERT';
  }
  
  if (text.includes('caste certificate') || text.includes('scheduled caste') || text.includes('scheduled tribe')) {
    return 'CASTE_CERT';
  }
  
  if (text.includes('marksheet') || text.includes('marks obtained') || text.includes('percentage')) {
    return 'EDUCATION';
  }
  
  return 'UNKNOWN';
}
```

---

### 3. CREATE OCR UPLOAD COMPONENT

**File:** `components/documents/OCRDocumentUpload.tsx`

```typescript
'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { extractTextFromImage, estimateImageQuality, preprocessImage, type OCRResult, type OCRProgress } from '@/lib/ocr/tesseract-ocr';
import {
  parseAadhaarData,
  parsePANData,
  parseIncomeCertificateData,
  parseEducationDocumentData,
  detectDocumentType,
  type AadhaarData,
  type PANData,
  type IncomeCertificateData,
  type EducationDocumentData
} from '@/lib/ocr/document-parsers';

interface OCRDocumentUploadProps {
  documentCode: string;
  documentName: string;
  onDataExtracted: (data: any) => void;
  onUploadComplete: () => void;
  maxSize?: number;
}

export default function OCRDocumentUpload({
  documentCode,
  documentName,
  onDataExtracted,
  onUploadComplete,
  maxSize = 10 * 1024 * 1024 // 10MB
}: OCRDocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [ocrProgress, setOcrProgress] = useState<OCRProgress>({ status: '', progress: 0 });
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [qualityCheck, setQualityCheck] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<string | null>(null);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;
    
    setError(null);
    setFile(selectedFile);
    setOcrStatus('idle');
    
    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
    
    // Check quality
    const quality = await estimateImageQuality(selectedFile);
    setQualityCheck(quality);
    
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    },
    maxSize,
    multiple: false
  });
  
  const handleOCR = async () => {
    if (!file) return;
    
    setOcrStatus('processing');
    setError(null);
    
    try {
      // Preprocess image for better accuracy
      const processedFile = await preprocessImage(file);
      
      // Run OCR
      const result = await extractTextFromImage(
        processedFile,
        'eng+hin', // Support English + Hindi
        (progress) => setOcrProgress(progress)
      );
      
      setOcrResult(result);
      
      // Auto-detect document type if not specified
      const docType = detectedType || detectDocumentType(result.text);
      setDetectedType(docType);
      
      // Parse structured data based on document type
      let parsed: any = null;
      
      if (docType === 'AADHAAR' || documentCode === 'AADHAAR') {
        parsed = parseAadhaarData(result.text);
      } else if (docType === 'PAN' || documentCode === 'PAN') {
        parsed = parsePANData(result.text);
      } else if (docType === 'INCOME_CERT' || documentCode === 'INCOME_CERT') {
        parsed = parseIncomeCertificateData(result.text);
      } else if (docType === 'EDUCATION' || documentCode.includes('EDUCATION')) {
        parsed = parseEducationDocumentData(result.text);
      }
      
      setExtractedData(parsed);
      setOcrStatus('success');
      
      // Notify parent component
      if (parsed) {
        onDataExtracted({
          ...parsed,
          ocrConfidence: result.confidence,
          ocrText: result.text,
          documentType: docType
        });
      }
      
    } catch (err: any) {
      console.error('OCR Error:', err);
      setError(err.message || 'OCR processing failed');
      setOcrStatus('error');
    }
  };
  
  const handleUpload = async () => {
    if (!file || !extractedData) return;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentCode', documentCode);
      formData.append('ocrData', JSON.stringify({
        text: ocrResult?.text,
        confidence: ocrResult?.confidence,
        extractedData,
        detectedType
      }));
      
      const response = await fetch('/api/documents/upload-with-ocr', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      onUploadComplete();
      
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!file && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {documentName} - JPG, PNG up to 10MB
          </p>
        </div>
      )}
      
      {/* File Preview & OCR */}
      {file && (
        <div className="border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Image Preview */}
            <div>
              <h3 className="font-semibold mb-2">Document Preview</h3>
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full rounded border"
                />
              )}
              <p className="mt-2 text-sm text-gray-600">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
              
              {/* Quality Check */}
              {qualityCheck && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded">
                      <div
                        className={`h-full rounded ${
                          qualityCheck.score >= 80 ? 'bg-green-500' :
                          qualityCheck.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${qualityCheck.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{qualityCheck.score}/100</span>
                  </div>
                  
                  {qualityCheck.issues.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {qualityCheck.issues.map((issue: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-red-600">
                          <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {qualityCheck.warnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {qualityCheck.warnings.map((warning: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-yellow-600">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* OCR Results */}
            <div>
              <h3 className="font-semibold mb-2">Extracted Data</h3>
              
              {ocrStatus === 'idle' && (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">
                    Click "Extract Data" to begin OCR
                  </p>
                  <button
                    onClick={handleOCR}
                    disabled={qualityCheck && qualityCheck.score < 40}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Extract Data
                  </button>
                </div>
              )}
              
              {ocrStatus === 'processing' && (
                <div className="text-center py-8">
                  <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
                  <p className="mt-2 text-sm text-gray-600">
                    {ocrProgress.status}
                  </p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${ocrProgress.progress * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {ocrStatus === 'success' && extractedData && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Data Extracted Successfully</span>
                  </div>
                  
                  {detectedType && (
                    <div className="text-sm">
                      <span className="text-gray-500">Detected Type:</span>
                      <span className="ml-2 font-medium">{detectedType}</span>
                    </div>
                  )}
                  
                  {ocrResult && (
                    <div className="text-sm">
                      <span className="text-gray-500">Confidence:</span>
                      <span className="ml-2 font-medium">{Math.round(ocrResult.confidence)}%</span>
                    </div>
                  )}
                  
                  <div className="mt-4 space-y-2 text-sm">
                    {Object.entries(extractedData).map(([key, value]) => (
                      value && (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="font-medium">{value as string}</span>
                        </div>
                      )
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-3">
                      Please verify the extracted data is correct
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpload}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        ✓ Looks Good, Upload
                      </button>
                      <button
                        onClick={() => setOcrStatus('idle')}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                      >
                        Retry OCR
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {ocrStatus === 'error' && (
                <div className="text-center py-8">
                  <XCircle className="mx-auto h-12 w-12 text-red-500" />
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                  <button
                    onClick={handleOCR}
                    className="mt-4 px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Retry OCR
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
                setOcrStatus('idle');
                setExtractedData(null);
                setError(null);
              }}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {error && ocrStatus !== 'error' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
```

---

### 4. CREATE API ROUTE FOR UPLOAD WITH OCR

**File:** `app/api/documents/upload-with-ocr/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentCode = formData.get('documentCode') as string;
    const ocrDataStr = formData.get('ocrData') as string;
    
    if (!file || !documentCode) {
      return NextResponse.json(
        { error: 'File and documentCode are required' },
        { status: 400 }
      );
    }
    
    // Parse OCR data
    let ocrData = null;
    try {
      ocrData = JSON.parse(ocrDataStr);
    } catch {
      // OCR data is optional
    }
    
    // Get document ID from code
    const { data: document } = await supabase
      .from('documents')
      .select('id')
      .eq('document_code', documentCode)
      .single();
    
    if (!document) {
      return NextResponse.json(
        { error: 'Invalid document code' },
        { status: 400 }
      );
    }
    
    // Upload to Supabase Storage
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/documents/${timestamp}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);
    
    if (uploadError) {
      return NextResponse.json(
        { error: 'File upload failed' },
        { status: 500 }
      );
    }
    
    // Get signed URL
    const { data: urlData } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 365 * 24 * 60 * 60); // 1 year
    
    if (!urlData) {
      return NextResponse.json(
        { error: 'Failed to generate URL' },
        { status: 500 }
      );
    }
    
    // Save to database with OCR metadata
    const { data: userDoc, error: dbError } = await supabase
      .from('user_documents')
      .upsert({
        user_id: userId,
        document_id: document.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: urlData.signedUrl,
        verification_status: 'PENDING',
        metadata: {
          ocr_text: ocrData?.text,
          ocr_confidence: ocrData?.confidence,
          ocr_method: 'tesseract',
          extracted_data: ocrData?.extractedData,
          detected_type: ocrData?.documentType,
          verified_by_user: true,
          processed_at: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save document' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      document: userDoc,
      message: 'Document uploaded successfully with OCR data'
    });
    
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
```

---

## TESTING CHECKLIST

### Manual Testing Steps

**Test 1: Aadhaar Card OCR**
1. Navigate to document upload page
2. Select "Aadhaar Card" document type
3. Upload a clear Aadhaar image (use sample from internet or your own)
4. Click "Extract Data"
5. Verify extracted data:
   - ✓ Aadhaar number (12 digits)
   - ✓ Name matches
   - ✓ DOB correct
   - ✓ Gender correct
   - ✓ Address extracted
6. Click "Looks Good, Upload"
7. Check Supabase:
   - user_documents table has new record
   - metadata.extracted_data contains parsed fields
   - file_url accessible

**Test 2: PAN Card OCR**
1. Upload PAN card image
2. Verify extracted:
   - ✓ PAN number (ABCDE1234F format)
   - ✓ Name
   - ✓ DOB
3. Upload successful

**Test 3: Low Quality Image**
1. Upload intentionally blurry/low-res image
2. Quality check should show warnings
3. OCR may have lower confidence
4. User can still proceed or retry

**Test 4: Wrong File Type**
1. Try uploading .docx or .txt
2. Should be rejected at dropzone level
3. Error message shown

**Test 5: Large File**
1. Upload 15MB image (exceeds 10MB limit)
2. Dropzone rejects it
3. Error shown

### Success Criteria
- ✅ Aadhaar extraction: 85%+ accuracy
- ✅ PAN extraction: 90%+ accuracy
- ✅ Income cert: 75%+ accuracy
- ✅ OCR completes in <5 seconds
- ✅ Quality warnings shown appropriately
- ✅ Extracted data editable before upload
- ✅ All data saved in metadata field
- ✅ No console errors

---

## DELIVERABLES

Once you complete this implementation, you should have:

1. ✅ `lib/ocr/tesseract-ocr.ts` - OCR utility (300 lines)
2. ✅ `lib/ocr/document-parsers.ts` - Parsers for 4+ document types (500 lines)
3. ✅ `components/documents/OCRDocumentUpload.tsx` - Full UI component (400 lines)
4. ✅ `app/api/documents/upload-with-ocr/route.ts` - API endpoint (100 lines)
5. ✅ Working OCR extraction for Aadhaar, PAN, Income Cert, Education docs
6. ✅ Quality estimation before OCR
7. ✅ User verification before save
8. ✅ Metadata stored in Supabase

**Total LOC:** ~1,300 lines of production-ready code

---

## TECH STACK SUMMARY

- tesseract.js: v5.0.4+
- react-dropzone: v14+
- lucide-react: Icons
- TypeScript: Strict mode
- Supabase: Database + Storage
- Next.js 14: App Router

---

## OPTIONAL ENHANCEMENTS (If Time Permits)

1. **PaddleOCR Fallback** - Deploy Python API on Railway for complex docs
2. **GPT-4o-mini Ultimate Fallback** - For <5% failed cases
3. **Edit Mode** - Let users edit extracted fields before upload
4. **Bulk Upload** - Process multiple documents at once
5. **Progress Persistence** - Save partial OCR results if user leaves page

---

## CODE STYLE REQUIREMENTS

- Use TypeScript strict mode (no `any` types except in error handling)
- Add JSDoc comments for all exported functions
- Use async/await (no callbacks or .then())
- Handle ALL errors with try-catch
- Add loading states for ALL async operations
- Use Supabase RLS for security
- Follow Next.js 14 App Router conventions
- Use Tailwind CSS for styling
- Mobile-responsive design

---

## NOTES

- Tesseract.js is 100% free and runs client-side (in browser)
- No server cost for OCR processing
- Works offline after initial load
- Privacy-friendly (images never leave user's browser unless they upload)
- Supports 100+ languages (we use eng+hin for Indian documents)
- Accuracy: 80-90% for clear images, 60-75% for poor quality

---

**END OF PROMPT BLOCK 1**

**Estimated Time:** 15 hours  
**Difficulty:** Medium  
**Dependencies:** tesseract.js, react-dropzone, Supabase

**START CODING NOW.**
