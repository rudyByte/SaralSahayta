import { NextRequest, NextResponse } from "next/server";
import { getDistrictsByState } from "@/lib/india-data";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");

    if (!state) {
        return NextResponse.json({ success: false, error: "State parameter is required" }, { status: 400 });
    }

    const districts = getDistrictsByState(state);
    return NextResponse.json({ success: true, districts });
}
