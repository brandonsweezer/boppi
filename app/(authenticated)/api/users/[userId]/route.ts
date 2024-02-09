import { userRepository } from "@/lib/db/container";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params:  { slug: string } }) {
    try {
        const message = await userRepository.readById(params.slug);
        return NextResponse.json(message, { status: 200 })
    } catch (e) {
        console.log(e);
        return NextResponse.json('Something went wrong', { status: 500 });
    }
}