import { NextRequest, NextResponse } from "next/server";
// import jwt from 'jsonwebtoken'; // cannot use this on middleware because the next edge runtime doesnt support it
import { jwtVerify, type JWTPayload } from 'jose';

export default async function (request: NextRequest) {
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader) return NextResponse.redirect(new URL('/login', request.url))
    // const token = authHeader.split(' ')[1];
    const token = request.cookies.get('token') as { name: string, value: string }; // it's a cookie
    try {
        const { payload, protectedHeader } = await jwtVerify(token.value, new TextEncoder().encode(process.env.JWT_PRIVATE));
        console.log('payload', payload);
        return NextResponse.next();
    } catch (err) {
        console.log('failed to verify JWT', err);
        return NextResponse.redirect(new URL('/login', request.url))
    }
}