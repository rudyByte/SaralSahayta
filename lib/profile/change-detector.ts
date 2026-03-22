import { differenceInYears, parseISO } from 'date-fns';

export interface ProfileChange {
    field: string;
    oldValue: any;
    newValue: any;
    impactsEligibility: boolean;
}

export function detectProfileChanges(
    currentProfile: any,
    extractedData: any,
    documentType: string
): ProfileChange[] {
    const changes: ProfileChange[] = [];
    
    if (!currentProfile || !extractedData) return changes;

    if (documentType === 'INCOME_CERT' || documentType === 'INCOME') {
        if (extractedData.annualIncome && 
            extractedData.annualIncome !== currentProfile.annual_income) {
            changes.push({
                field: 'Annual Income',
                oldValue: currentProfile.annual_income ? `₹${currentProfile.annual_income.toLocaleString()}` : 'Not set',
                newValue: `₹${extractedData.annualIncome.toLocaleString()}`,
                impactsEligibility: true
            });
        }
    }
    
    if (documentType === 'AADHAAR') {
        if (extractedData.dateOfBirth && 
            extractedData.dateOfBirth !== currentProfile.date_of_birth) {
            let oldAge = 'Not set';
            let newAge = 0;
            try {
                if (currentProfile.date_of_birth) {
                    oldAge = differenceInYears(new Date(), parseISO(currentProfile.date_of_birth)).toString();
                }
                newAge = differenceInYears(new Date(), parseISO(extractedData.dateOfBirth));
            } catch (e) {}
            
            changes.push({
                field: 'Date of Birth (Age)',
                oldValue: `${currentProfile.date_of_birth || 'Not set'} (${oldAge} yrs)`,
                newValue: `${extractedData.dateOfBirth} (${newAge} yrs)`,
                impactsEligibility: oldAge !== newAge.toString()
            });
        }
        
        if (extractedData.address && 
            extractedData.address !== currentProfile.full_address) {
            changes.push({
                field: 'Address',
                oldValue: currentProfile.full_address || 'Not set',
                newValue: extractedData.address,
                impactsEligibility: false
            });
        }

        if (extractedData.gender && extractedData.gender !== currentProfile.gender) {
             changes.push({
                field: 'Gender',
                oldValue: currentProfile.gender || 'Not set',
                newValue: extractedData.gender,
                impactsEligibility: true
            });
        }
    }

    if (documentType === 'PAN') {
         if (extractedData.name && extractedData.name !== currentProfile.name) {
             changes.push({
                field: 'Full Name',
                oldValue: currentProfile.name || 'Not set',
                newValue: extractedData.name,
                impactsEligibility: false
            });
         }
    }

    if (documentType === 'EDUCATION') {
         if (extractedData.course && extractedData.course !== currentProfile.education) {
              changes.push({
                field: 'Education',
                oldValue: currentProfile.education || 'Not set',
                newValue: extractedData.course,
                impactsEligibility: true
            });
         }
    }
    
    return changes;
}
