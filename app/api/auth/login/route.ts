import hash from "@/lib/auth/hash";
import issueToken from "@/lib/auth/issueToken";
import { User } from "@/types/user";
import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/lib/db/container";
import createJWTResponse from "@/lib/auth/createJWTResponse";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();
        const hashedPassword = hash(password); 
        if (!email || !password) {
            return NextResponse.json('email or password missing', { status: 400 })
        }

        const user = await userRepository.login({email, hashedPassword});
        if (user === null) {
            return NextResponse.json('Sign in Failed', { status: 401 })
        }

        const response = createJWTResponse(user, 'logged in', { status: 200 })
        return response;
    } catch (err) {
        // no user, reject
        console.log('sign in failed', err);
        return NextResponse.json('Sign in Failed', { status: 401 })
    }
}