import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { encryptSensitiveData } from '@/lib/security/data-encryption';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (error) { } },
                remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch (error) { } },
            },
        }
    );
};

export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    const headerList = headers();
    const body = await request.json();
    
    const { schemeId, formData, attachedDocs } = body;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
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

    // 3. Insert into "applications" (Triggers auto-generate trackingId)
    const { data: application, error: submitError } = await supabase
      .from('applications')
      .insert({
        user_id: session.user.id,
        scheme_id: schemeId,
        form_data: sanitizedFormData,
        "formDataEncrypted": JSON.stringify(encryptedData),
        status: 'SUBMITTED',
        submitted_at: new Date().toISOString(),
        "attachedDocuments": attachedDocs,
        "ipAddress": ip,
        "userAgent": userAgent,
        "submissionSource": 'web'
      })
      .select()
      .single();

    if (submitError) throw submitError;

    return NextResponse.json({ 
      success: true, 
      applicationNumber: application.trackingId 
    });

  } catch (error: any) {
    console.error('Submission Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
