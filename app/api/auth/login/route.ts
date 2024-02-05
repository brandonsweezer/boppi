import hash from "@/lib/auth/hash";
import issueToken from "@/lib/auth/issueToken";
import { User } from "@/types/user";

import { MongoClient, ServerApiVersion } from "mongodb";
import { NextRequest, NextResponse } from "next/server";


const client = new MongoClient(process.env.MONGODB_URI ?? '', {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})

export async function POST(request: NextRequest) {
    console.log('logging in');
    const { username, password } = await request.json();
    const hashedPassword = hash(password); 
    // verify with database
    try {
        // lookup user from db
        await client.connect();
        console.log('getting user');
        const user = await client.db('lookie').collection('users').findOne(
            {
                username,
                password: hashedPassword
            }
        )
        console.log(user);
        if (user === null) {
            throw new Error('User not found')
        }
        // issue JWT token on success
        console.log('issuing token');
        const token = issueToken(user as unknown as User)
        console.log(token);
        // return token
        const response = NextResponse.json('logged in', {status: 200})
        response.cookies.set('token', token)
        return response;
    } catch (err) {
        console.log('sign in failed', err);
        return NextResponse.json('Sign in Failed', {status: 401})
        // no user, reject
    } finally {
        try {
            await client.close();
        } catch (err) {
            return NextResponse.json({ error: 'Failed to close MongoDB client.' }, { status: 500 });
        }
    }
}