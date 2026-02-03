import { NextResponse } from 'next/server';

// GET /api/schemes - Get all schemes with filters
export async function GET(request: Request) {
    // Implementation coming in next prompt
    return NextResponse.json({ message: 'Schemes API endpoint' });
}

// POST /api/schemes - Create new scheme (admin only)
export async function POST(request: Request) {
    // Implementation coming in next prompt
    return NextResponse.json({ message: 'Create scheme endpoint' });
}
