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

    // 3. Insert into "Application" (Tracking ID can be updated or generated later)
    const { data: application, error: submitError } = await supabase
      .from('Application')
      .insert({
        userId: session.user.id,
        schemeId: schemeId,
        formData: sanitizedFormData,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString()
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
