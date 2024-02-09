import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('token') as { name: string, value: string };
        const { payload: userObj } = await jwtVerify(token.value, new TextEncoder().encode(process.env.JWT_PRIVATE));
        return NextResponse.json(userObj, { status: 200 });
    } catch (e) {
        console.log(e);
        return NextResponse.json('Something went wrong when getting your user information', { status: 500 })
    }
}