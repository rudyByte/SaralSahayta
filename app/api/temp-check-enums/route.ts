import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('documents')
            .select('*')
            .limit(1);

        // Get column details via RPC or raw SQL (if possible)
        // Since we can't run raw SQL easily, we'll try to find any existing categories
        const { data: categories } = await supabaseAdmin
            .from('documents')
            .select('category');

        const uniqueCategories = Array.from(new Set(categories?.map(c => c.category)));

        return NextResponse.json({ 
            uniqueCategories,
            sampleDoc: data?.[0]
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
