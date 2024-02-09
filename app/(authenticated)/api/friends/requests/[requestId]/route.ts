import { messageRepository, userRepository } from "@/lib/db/container";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: { requestId: string } }) {
    try {
        const { accept }: { accept: boolean } = await request.json();
        const message = await messageRepository.readById(params.requestId);
        if (accept) {
            // update both userObjs
            // could do this whole transaction in a query, but im lazy
            const sender = await userRepository.readById(message.fromId)
            const receiver = await userRepository.readById(message.toId)
            if (!sender || !receiver) {
                return NextResponse.json('Both users do not exist!', { status: 404 })
            }

            // this should be a transaction (again i'm lazy)
            const updatedSender = await userRepository.update(
                {...sender, friendIds: [...sender.friendIds, {id: message.toId, name: receiver.email}]}
            )
            const updatedReceiver = await userRepository.update(
                {...receiver, friendIds: [...receiver.friendIds, {id: message.fromId, name: sender.email}]}
            )
        }
        // delete message
        const messageDeleted = await messageRepository.delete(params.requestId)
        if (messageDeleted) {
            return NextResponse.json('ok', { status: 200 })
        }
        return NextResponse.json('Friend request not disposed of', { status: 500 })
    } catch (e) {
        console.log(e);
        return NextResponse.json('Something went wrong', { status: 500 })
    }
}