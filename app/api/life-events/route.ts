import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { LifeEventType, LifeEventCategory } from '@/types/life-events';

export async function GET() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from('user_life_events')
            .select('*')
            .eq('user_id', user.id)
            .order('event_date', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching life events:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { events } = await req.json();

        if (!Array.isArray(events)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // 1. Prepare data for insert
        const eventsToInsert = events.map(event => ({
            user_id: user.id,
            event_type: event.type as LifeEventType,
            event_category: event.category as LifeEventCategory,
            event_date: event.date,
            event_details: event.details || {},
            is_verified: false
        }));

        // 2. Insert events
        const { error: insertError } = await supabase
            .from('user_life_events')
            .upsert(eventsToInsert, { 
                onConflict: 'user_id,event_type,event_date' 
            });

        if (insertError) throw insertError;

        // 3. Update user profile to mark life events as completed
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ 
                life_events_completed: true,
                last_life_event_update: new Date().toISOString()
            })
            .eq('user_id', user.id);

        if (updateError) throw updateError;

        // 4. Return success with placeholder for schemesFound
        // (Real calculation logic will be added in Block 3)
        return NextResponse.json({ 
            success: true, 
            schemesFound: events.length * 2 // Placeholder 
        });

    } catch (error: any) {
        console.error('Error saving life events:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
