import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function POST() {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.notification.updateMany({
            where: { userId: user.id },
            data: { isRead: true }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Notifications API] Error marking all as read:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
