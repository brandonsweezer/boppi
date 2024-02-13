import { sessionRepository } from "@/lib/db/container";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
    try {
        const message = await sessionRepository.readById(params.sessionId);
        return NextResponse.json(message, { status: 200 })
    } catch (e) {
        console.log(e);
        return NextResponse.json('Something went wrong', { status: 500 });
    }
}