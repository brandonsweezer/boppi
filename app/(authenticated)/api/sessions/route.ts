import { sessionRepository } from "@/lib/db/container";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('token') as { name: string, value: string };
        const { payload: userObj } = await jwtVerify(token.value, new TextEncoder().encode(process.env.JWT_PRIVATE));
        const m = await request.json();
        m.hostId = userObj._id;
        if (!m.title || !m.hostId || !m.startTime) {
            return NextResponse.json('Bad Request', { status: 400 })
        }
        const newMessage = await sessionRepository.create(m);
        return NextResponse.json(newMessage, { status: 201 })
    } catch (e) {
        console.log(e);
        return NextResponse.json('Something went wrong', { status: 500 });
    }
}