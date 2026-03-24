/**
 * Maps OCR-extracted data from user documents to application form fields.
 */
export function mapOCRToFormFields(documentData: any[], schemeSlug: string) {
  const formData: Record<string, string> = {};

  // Helper to find data by document type code
  const getDoc = (code: string) => documentData.find(d => d.documents?.document_code === code)?.ocr_data || {};

  const aadhaar = getDoc('AADHAAR');
  const pan = getDoc('PAN');
  const bank = getDoc('BANK_PASSBOOK');

  // Generic mappings (Common across most schemes)
  if (aadhaar.name) formData.full_name = aadhaar.name;
  if (aadhaar.aadhaar_number) formData.aadhaar_number = aadhaar.aadhaar_number;
  if (aadhaar.dob) formData.dob = aadhaar.dob;
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
