import { NextRequest, NextResponse } from "next/server";
// import jwt from 'jsonwebtoken'; // cannot use this on middleware because the next edge runtime doesnt support it
import { jwtVerify, type JWTPayload } from 'jose';

import { User } from "@/types/user";

export default function (request: NextRequest) {
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader) return NextResponse.redirect(new URL('/login', request.url))
    // const token = authHeader.split(' ')[1];
    const token = request.cookies.get('token') as { name: string, value: string }; // it's a cookie
    try {
        console.log('got token!', token);
        const user = jwtVerify(token.value, new TextEncoder().encode(process.env.JWT_PRIVATE)) as unknown as User;
        console.log('got user', user);
        return NextResponse.next();
    } catch (err) {
        console.log(err);
        return NextResponse.redirect(new URL('/login', request.url))
    }
}