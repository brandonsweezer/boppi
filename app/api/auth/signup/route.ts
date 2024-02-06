import createJWTResponse from "@/lib/auth/createJWTResponse";
import hash from "@/lib/auth/hash";
import issueToken from "@/lib/auth/issueToken";
import { userRepository } from "@/lib/db/container";
import { NewUserRequest } from "@/types/user";

import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();
        if (!email || !password) {
            return NextResponse.json('email or password missing', { status: 400 })
        }

        const hashedPassword = hash(password); 

        const userExists = await userRepository.exists({ email })
        // if user exists, redirect to login.
        if (userExists) {
            return NextResponse.json('User already exists!', { status: 409 })
        }
        // otherwise, create user
        const newUserRequest: NewUserRequest = {
            email: email,
            password: hashedPassword
        }
        const newUser = await userRepository.create(newUserRequest)
        
        const response = createJWTResponse(newUser, 'signed up', { status: 200 })
        return response
    } catch (err) {
        console.log('sign up failed', err);
        return NextResponse.json(err, { status: 401 })
    }
}