import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { LifeEventType, LifeEventCategory } from '@/types/life-events';

const LIFE_EVENT_CATEGORY_HINTS: Record<string, string[]> = {
    TENTH_PASS: ['EDUCATION', 'SKILL_DEVELOPMENT'],
    TWELFTH_PASS: ['EDUCATION', 'SKILL_DEVELOPMENT'],
    DIPLOMA: ['EDUCATION', 'SKILL_DEVELOPMENT', 'EMPLOYMENT'],
    COLLEGE_ADMISSION: ['EDUCATION'],
    GRADUATION: ['EDUCATION', 'EMPLOYMENT', 'SKILL_DEVELOPMENT'],
    POST_GRADUATION: ['EDUCATION'],
    MASTERS: ['EDUCATION'],
    PHD: ['EDUCATION'],
    UNMARRIED: ['EDUCATION', 'EMPLOYMENT'],
    MARRIAGE: ['WOMEN_CHILD', 'HOUSING'],
    CHILDBIRTH: ['WOMEN_CHILD', 'HEALTHCARE'],
    SINGLE_CHILD: ['EDUCATION', 'WOMEN_CHILD'],
    GIRL_CHILD: ['EDUCATION', 'WOMEN_CHILD'],
    SINGLE_PARENT: ['WOMEN_CHILD', 'EDUCATION', 'HOUSING'],
    WIDOWHOOD: ['WOMEN_CHILD', 'HEALTHCARE'],
    DIVORCE: ['WOMEN_CHILD', 'HOUSING'],
    SEPARATION: ['WOMEN_CHILD', 'HOUSING'],
    ORPHAN: ['EDUCATION', 'HEALTHCARE'],
    DISABILITY: ['DISABILITY', 'HEALTHCARE', 'EDUCATION'],
    SERIOUS_ILLNESS: ['HEALTHCARE'],
    TURNED_60: ['SENIOR_CITIZEN', 'HEALTHCARE'],
    TURNED_70: ['SENIOR_CITIZEN', 'HEALTHCARE'],
    STARTING_BUSINESS: ['ENTREPRENEURSHIP'],
    FARMING_INITIATED: ['AGRICULTURE'],
    LOW_INCOME: ['HOUSING', 'EDUCATION', 'HEALTHCARE'],
    CROP_LOSS: ['AGRICULTURE'],
    FIRST_JOB: ['EMPLOYMENT', 'SKILL_DEVELOPMENT'],
    JOB_LOSS: ['EMPLOYMENT', 'SKILL_DEVELOPMENT'],
    UNEMPLOYED: ['EMPLOYMENT', 'SKILL_DEVELOPMENT'],
    SKILL_UPGRADE: ['SKILL_DEVELOPMENT', 'EMPLOYMENT'],
    RETIREMENT: ['SENIOR_CITIZEN'],
};

async function countPotentialSchemes(supabase: any, eventTypes: string[]) {
    const schemeIds = new Set<string>();
    const { data: mappings } = await supabase
        .from('life_event_scheme_mapping')
        .select('scheme_id')
        .in('event_type', eventTypes);

    (mappings || []).forEach((row: any) => {
        if (row.scheme_id) schemeIds.add(row.scheme_id);
    });

    const categoryHints = Array.from(new Set(eventTypes.flatMap((type) => LIFE_EVENT_CATEGORY_HINTS[type] || [])));
    if (categoryHints.length > 0) {
        const { data: schemes } = await supabase
            .from('schemes')
            .select('id')
            .eq('isActive', true)
            .in('category', categoryHints);
        (schemes || []).forEach((scheme: any) => schemeIds.add(scheme.id));
    }

    return schemeIds.size;
}

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
        const body = await req.json();
        const { events, skip } = body;

        // If skip is true, just update the profile and return
        if (skip) {
            const { error: skipUpdateError } = await supabase
                .from('user_profiles')
                .update({ 
                    life_events_completed: true,
                    last_life_event_update: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (skipUpdateError) throw skipUpdateError;
            return NextResponse.json({ success: true, skipped: true });
        }

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

        const schemesFound = await countPotentialSchemes(supabase, eventsToInsert.map((event) => event.event_type));

        return NextResponse.json({ 
            success: true, 
            schemesFound,
        });

    } catch (error: any) {
        console.error('Error saving life events:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
