import { NextRequest, NextResponse } from "next/server";
import { messageRepository } from "@/lib/db/container";
import { MessageType, NewMessageRequest } from "@/types/message";

export async function POST(request: NextRequest) {
    try {
        const { fromId, toId, content } = await request.json();
        const friendRequests = await messageRepository.readByType({ messageType: MessageType.FriendRequest, toId });
        for (let message of friendRequests) {
            if (message.fromId === fromId) {
                return NextResponse.json(message, { status: 409 }); // friend request already exists
            }
        }

        // create the friend reqeuest
        const newMessageRequest: NewMessageRequest = {
            date: new Date(),
            fromId,
            toId,
            type: MessageType.FriendRequest,
            content,
        }
        const newFriendRequest = await messageRepository.create(newMessageRequest);
        return NextResponse.json(newFriendRequest, { status: 201 });
    } catch (e) {
        console.log('error when creating friend request', e);
        return NextResponse.json('An error ocurred when creating your friend request', { status: 500 })
    }
}