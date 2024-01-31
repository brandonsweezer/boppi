import { SignalingMessage } from "@/types/signaling";
import { NextRequest, NextResponse } from "next/server";
import Pusher from 'pusher';

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID ?? '',
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY ?? '',
    secret: process.env.PUSHER_APP_SECRET ?? '',
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? '',
    useTLS: true
  })

export async function POST(request: NextRequest) {
    const message = await request.json() as SignalingMessage;
    const res = await pusher.trigger(message.roomCode, 'client-message', message)
    return NextResponse.json(res);
}