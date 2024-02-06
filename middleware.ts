import { NextRequest, NextResponse } from "next/server";
import verifyToken from "@/lib/auth/verifyToken";

export function middleware(request: NextRequest) {
    return verifyToken(request);
}

export const config = {
    matcher: ["/((?!login|signup|logout|api/auth/*|_next/static|_next/image|favicon.ico|public|$).*)", '/']
}