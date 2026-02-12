export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// GET /api/schemes/[id] - Get single scheme
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    // Implementation coming in next prompt
    return NextResponse.json({ message: `Scheme ${params.id} endpoint` });
}

// PUT /api/schemes/[id] - Update scheme (admin only)
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    // Implementation coming in next prompt
    return NextResponse.json({ message: `Update scheme ${params.id} endpoint` });
}

// DELETE /api/schemes/[id] - Delete scheme (admin only)
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    // Implementation coming in next prompt
    return NextResponse.json({ message: `Delete scheme ${params.id} endpoint` });
}
