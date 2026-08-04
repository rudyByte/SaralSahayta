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
    
    const { schemeId, formData, attachedDocs } = body;

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

    // 2. Prepare submission metadata
    const ip = headerList.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = headerList.get('user-agent') || 'unknown';

    // 3. Insert into "Application" table natively using Supabase REST over HTTPS 
    // because Prisma TCP ports (5432/6543) are universally blocked on this network!
    const { data: application, error: submitError } = await supabase
      .from('Application')
      .insert({
        userId: user.id,
        schemeId: schemeId,
        formData: sanitizedFormData,
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
        trackingId: `SARAL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      })
      .select()
      .single();

    if (submitError) {
        console.error('Insert Error Detail:', submitError);
        throw submitError;
    }

    return NextResponse.json({ 
      success: true, 
      applicationNumber: application.trackingId || application.tracking_id || application.id,
      application
    });

  } catch (error: any) {
    console.error('Submission Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
