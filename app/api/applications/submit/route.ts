import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { encryptSensitiveData } from '@/lib/security/data-encryption';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const headerList = headers();
    const body = await request.json();
    
    const { schemeId, formData } = body;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!schemeId || !formData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Encrypt sensitive fields
    const sensitiveFields = ['aadhaar_number', 'pan_number', 'bank_account_number'];
    const encryptedData: Record<string, string> = {};
    const sanitizedFormData = { ...formData };

    sensitiveFields.forEach(field => {
      if (formData[field]) {
        encryptedData[field] = encryptSensitiveData(formData[field]);
        delete sanitizedFormData[field]; // Remove from plain form_data
      }
    });
    if (Object.keys(encryptedData).length > 0) {
      sanitizedFormData.encrypted_fields = encryptedData;
    }

    // 2. Prepare submission metadata
    const ip = headerList.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = headerList.get('user-agent') || 'unknown';

    const trackingId = `SARAL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const { data: application, error: submitError } = await supabase
      .from('applications')
      .insert({
        user_id: user.id,
        scheme_id: schemeId,
        form_data: sanitizedFormData,
        status: 'SUBMITTED',
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        tracking_id: trackingId,
      })
      .select()
      .single();

    if (submitError) {
        console.error('Insert Error Detail:', submitError);
        throw submitError;
    }

    return NextResponse.json({ 
      success: true, 
      applicationNumber: application.tracking_id || application.id,
      application
    });

  } catch (error: any) {
    console.error('Submission Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
