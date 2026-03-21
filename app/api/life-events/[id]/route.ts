import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { error } = await supabase
            .from('user_life_events')
            .delete()
            .eq('id', params.id)
            .eq('user_id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting life event:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
