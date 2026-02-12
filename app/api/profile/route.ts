export const dynamic = 'force-dynamic';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { fullProfileUpdateSchema } from '@/lib/validations';

// Helper to get supabase client
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

export async function GET() {
    try {
        const supabase = getSupabase();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch profile data from table
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (profileError) {
            console.log("Fetch Profile Notice (Expected if first time):", profileError.message);
            return NextResponse.json({
                id: user.id,
                mobile: (user.user_metadata as any).mobile,
                profile: null
            });
        }

        // Calculate completion percentage
        // Fields to check: [name, email, dob, gender, mobile] (Basic) + [category, income, state, district, education, occupation...] (Elig) + [bank, ifsc] (Bank)
        // For simplicity, we just use the stored value or recalc here if needed.
        // Let's rely on what stored in DB if we implemented it there, else do strictly frontend logic. 
        // We'll return the raw profile which has 'profile_completion_percentage' column if we added it.

        return NextResponse.json({ user, profile });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = getSupabase();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Validate with Zod
        const validation = fullProfileUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Validation failed', details: validation.error.format() }, { status: 400 });
        }

        const updates = validation.data;

        // Calculate Completion Percentage
        let completedFields = 0;
        const totalFields = 15; // Approx count of critical fields
        // Basic (5): Name, Email, Mobile, DOB, Gender
        if (updates.name || user.user_metadata.name) completedFields++;
        if (updates.email || user.email) completedFields++;
        if (user.user_metadata.mobile) completedFields++;
        if (updates.dateOfBirth || user.user_metadata.date_of_birth) completedFields++;
        if (updates.gender || user.user_metadata.gender) completedFields++;

        // Eligibility (8): Category, Income, State, District, Edu, Occu, Disab, DisabType
        if (updates.category) completedFields++;
        if (updates.annualIncome !== undefined) completedFields++;
        if (updates.state) completedFields++;
        if (updates.district) completedFields++;
        if (updates.education) completedFields++;
        if (updates.occupation) completedFields++;
        if (updates.disability !== undefined) completedFields++;
        // Bank (2)
        if (updates.bankAccount) completedFields++;
        if (updates.ifscCode) completedFields++;

        const percentage = Math.min(100, Math.round((completedFields / totalFields) * 100));

        // 1. Update Auth Metadata (for basic info syncing)
        // We only update what changed in basic info
        const metaUpdates: any = {};
        if (updates.name) metaUpdates.name = updates.name;
        if (updates.dateOfBirth) metaUpdates.date_of_birth = updates.dateOfBirth;
        if (updates.gender) metaUpdates.gender = updates.gender;
        if (updates.category) metaUpdates.category = updates.category;
        if (updates.state) metaUpdates.state = updates.state;

        if (Object.keys(metaUpdates).length > 0) {
            await supabase.auth.updateUser({ data: metaUpdates });
        }

        // 2. Update 'user_profiles' table
        // Map frontend camelCase to DB snake_case
        const dbUpdates = {
            full_name: updates.name,
            email: updates.email,
            date_of_birth: updates.dateOfBirth,
            gender: updates.gender,
            category: updates.category,
            annual_income: updates.annualIncome,
            state: updates.state,
            district: updates.district,
            education: updates.education,
            occupation: updates.occupation,
            disability: updates.disability,
            disability_type: updates.disabilityType,
            bank_account: updates.bankAccount,
            ifsc_code: updates.ifscCode,
            bank_name: updates.bankName,
            bank_branch: updates.branch,
            profile_completion_percentage: percentage,
            updated_at: new Date().toISOString(),
        };

        // Remove undefined keys
        Object.keys(dbUpdates).forEach(key => (dbUpdates as any)[key] === undefined && delete (dbUpdates as any)[key]);

        const { data: updatedProfile, error: updateError } = await supabase
            .from('user_profiles')
            .upsert({
                user_id: user.id,
                ...dbUpdates
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();

        if (updateError) {
            console.error("Supabase Save Error:", updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ profile: updatedProfile, completion: percentage });

    } catch (error: any) {
        console.error("Profile Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
