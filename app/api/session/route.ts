import { NextRequest, NextResponse } from "next/server";
import { Session } from '@/types/session'

import { MongoClient, ServerApiVersion } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URL ?? '', {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})

export async function POST(request: NextRequest) {
    try {
        const { user, title } = await request.json();
        const session: Omit<Session, "_id"> = {
            title,
            users: [user],
            startTime: new Date(),
            views: 0,
        }

        await client.connect();
        const result = await client.db('lookie').collection('sessions').insertOne(session);
        console.log(result);
        return new NextResponse(JSON.stringify(result), {status: 200})
    } catch (e) {
        console.error(e)
        return new NextResponse("Error creating session", {status: 500})
    } finally {
        await client.close();
    }
}