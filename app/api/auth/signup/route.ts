import hash from "@/lib/auth/hash";
import issueToken from "@/lib/auth/issueToken";
import { User } from "@/types/user";

import { MongoClient, ServerApiVersion } from "mongodb";
import { NextRequest, NextResponse } from "next/server";


const client = new MongoClient(process.env.MONGO_URL ?? '', {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})

export async function POST(request: NextRequest) {
    console.log('signing up!');
    const { username, password } = await request.json();
    const hashedPassword = hash(password); 
    // verify with database
    try {
        // lookup user from db
        await client.connect();
        console.log('connected to db');
        const existingUser = await client.db('lookie').collection('users').findOne(
            {
                username,
                password: hashedPassword
            }
        )
        console.log(existingUser);
        // if user exists, redirect to login.
        if (existingUser !== null) {
            throw new Error('User already exists!')
        }
        // otherwise, create user
        const newUser = await client.db('lookie').collection('users').insertOne({
            username,
            password: hashedPassword
        })
        // issue JWT token on success
        const token = issueToken(newUser as unknown as User)

        // return token
        const response = NextResponse.redirect(new URL('/host', request.url))
        response.cookies.set('token', token)
        return response
    } catch (err) {
        console.log(err);
        return NextResponse.json(err, {status: 401})
    } finally {
        await client.close();
    }
}