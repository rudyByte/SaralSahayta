import { NextResponse } from 'next/server';

// GET /api/profile - Get user profile
export async function GET(request: Request) {
    // Implementation coming in next prompt
    return NextResponse.json({ message: 'Profile GET endpoint' });
}

// PUT /api/profile - Update user profile
export async function PUT(request: Request) {
    // Implementation coming in next prompt
    return NextResponse.json({ message: 'Profile UPDATE endpoint' });
}
