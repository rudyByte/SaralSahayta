import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const prefs = await prisma.notificationPreference.findUnique({
            where: { userId: user.id }
        });

        return NextResponse.json({
            prefs: prefs || {
                smsEnabled: true,
                emailEnabled: true,
                whatsappEnabled: false,
                pushEnabled: true
            }
        });
    } catch (error) {
        console.error('[Notification Prefs API] GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        const updatedPrefs = await prisma.notificationPreference.upsert({
            where: { userId: user.id },
            update: {
                smsEnabled: body.smsEnabled,
                emailEnabled: body.emailEnabled,
                whatsappEnabled: body.whatsappEnabled,
                pushEnabled: body.pushEnabled,
            },
            create: {
                userId: user.id,
                smsEnabled: body.smsEnabled ?? true,
                emailEnabled: body.emailEnabled ?? true,
                whatsappEnabled: body.whatsappEnabled ?? false,
                pushEnabled: body.pushEnabled ?? true,
            }
        });

        return NextResponse.json({ success: true, prefs: updatedPrefs });
    } catch (error) {
        console.error('[Notification Prefs API] POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
