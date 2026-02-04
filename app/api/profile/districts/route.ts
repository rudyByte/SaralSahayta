import { NextResponse } from 'next/server';
import { getDistricts } from '@/lib/india-data';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');

    if (!state) {
        return NextResponse.json({ error: 'State parameter is required' }, { status: 400 });
    }

    const districts = getDistricts(state);
    return NextResponse.json({ districts });
}
