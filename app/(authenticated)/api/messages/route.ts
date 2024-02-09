import { messageRepository } from "@/lib/db/container";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const m = await request.json();
        if (!m.toId || !m.fromId || !m.content || !m.date || !m.type) {
            return NextResponse.json('Bad Request', { status: 400 })
        }
        const newMessage = await messageRepository.create(m);
        return NextResponse.json(newMessage, { status: 201 })
    } catch (e) {
        console.log(e);
        return NextResponse.json('Something went wrong', { status: 500 });
    }
}