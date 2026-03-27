export function mapOCRToFormFields(documentData: any[], schemeSlug: string) {
  const formData: Record<string, string> = {};

  // Helper to format DD/MM/YYYY to YYYY-MM-DD for date inputs
  const formatDateToInput = (dateStr: string | null) => {
    if (!dateStr || !dateStr.includes('/')) return dateStr || '';
    const [day, month, year] = dateStr.split('/');
    if (day && month && year) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  };

  // Helper to find data by document type code, checking multiple storage locations
  const getDoc = (code: string) => {
    const doc = documentData.find(d => d.documents?.document_code === code);
    if (!doc) return {};

    // Priority 1: ocr_data field (new format from upload-with-ocr)
    if (doc.ocr_data && typeof doc.ocr_data === 'object' && Object.keys(doc.ocr_data).length > 0) {
      return doc.ocr_data;
    }

    // Priority 2: metadata.extracted_data (legacy format)
    if (doc.metadata?.extracted_data) {
      return doc.metadata.extracted_data;
    }

    // Priority 3: metadata top-level (in case it was stored flat)
    if (doc.metadata && typeof doc.metadata === 'object') {
      const { ocr_text, ocr_confidence, ocr_method, detected_type, verified_by_user, processed_at, ...extractable } = doc.metadata;
      if (Object.keys(extractable).length > 0) {
        return extractable;
      }
    }

    return {};
  };

  const aadhaar = getDoc('AADHAAR');
  const pan = getDoc('PAN');
  const bank = getDoc('BANK_PASSBOOK');

  // Generic mappings (Common across most schemes)
  if (aadhaar.name) formData.full_name = aadhaar.name;
  if (aadhaar.aadhaarNumber) formData.aadhaar_number = aadhaar.aadhaarNumber;
  if (aadhaar.dateOfBirth) formData.dob = formatDateToInput(aadhaar.dateOfBirth);
  if (aadhaar.gender) formData.gender = aadhaar.gender;
  if (aadhaar.address) formData.permanent_address = aadhaar.address;

  if (pan.pan_number) formData.pan_number = pan.pan_number;

  if (bank.account_number) formData.bank_account_number = bank.account_number;
  if (bank.ifsc_code) formData.bank_ifsc = bank.ifsc_code;
  if (bank.bank_name) formData.bank_name = bank.bank_name;

  // Scheme-specific overrides or additions
  switch (schemeSlug) {
    case 'pm-matru-vandana-yojana':
      formData.beneficiary_name = aadhaar.name || '';
      formData.husband_name = ''; // Manual input
      break;
    
    case 'pm-kisan-samman-nidhi':
      formData.farmer_name = aadhaar.name || '';
      formData.land_holding_details = ''; // Manual input
      break;
    
    // Add more mappings as needed
  }

  return formData;
}
