import { NextRequest, NextResponse } from "next/server";

import { MongoClient, ServerApiVersion } from 'mongodb';
import Pusher from 'pusher';

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID ?? '',
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY ?? '',
    secret: process.env.PUSHER_APP_SECRET ?? '',
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? '',
    useTLS: true
  })

export async function POST(request: NextRequest) {
    const message = await request.json();
    
    console.log('sending message', message.type)
    pusher.trigger('signaling', 'client-message', message)
    return new NextResponse('ok', {status: 200})
}