import { NextRequest, NextResponse } from "next/server";
// import jwt from 'jsonwebtoken'; // cannot use this on middleware because 
// the next edge runtime doesn't include the 'crypto' package from nodejs
import { jwtVerify, type JWTPayload } from 'jose';

export default async function (request: NextRequest) {
    try {
        const token = request.cookies.get('token') as { name: string, value: string };
        const email = request.cookies.get('email');
        const { payload, protectedHeader } = await jwtVerify(token.value, new TextEncoder().encode(process.env.JWT_PRIVATE));
        if (payload.email !== email?.value) {
            throw new Error('invalid jwt')
        }
        
        return NextResponse.next(payload);
    } catch (err) {
        console.log('failed to verify JWT', err);
        return NextResponse.redirect(new URL('/login', request.url))
    }
}