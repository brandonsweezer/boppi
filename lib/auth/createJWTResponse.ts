import { User } from "@/types/user";
import issueToken from "@/lib/auth/issueToken";
import { NextResponse } from "next/server";

export default function (user: User, message: string, responseInit: ResponseInit | undefined) {
    // issue JWT token on success
    const token = issueToken(user)

    const response = NextResponse.json(message, responseInit)
    response.cookies.set('token', token, {
        sameSite: 'strict',
        secure: true
    })
    response.cookies.set('email', user.email)
    return response
}