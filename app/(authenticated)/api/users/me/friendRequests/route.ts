import { messageRepository } from "@/lib/db/container";
import { MessageType } from "@/types/message";
import { User } from "@/types/user";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('token') as { name: string, value: string };
        const { payload: userObj }: { payload: User } = await jwtVerify(token.value, new TextEncoder().encode(process.env.JWT_PRIVATE));
        const friendRequests = await messageRepository.readByType({ messageType: MessageType.FriendRequest, toId: userObj._id })
        
        return NextResponse.json(friendRequests, { status: 200 });
    } catch (e) {
        console.log(e);
        return NextResponse.json('Something went wrong when getting your user information', { status: 500 })
    }
}