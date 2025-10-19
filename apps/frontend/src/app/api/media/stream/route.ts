import { createServerAxios } from "@/lib/axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const path = searchParams.get("path");

	if (!path) {
		return NextResponse.json(
			{ error: "File path is required" },
			{ status: 400 }
		);
	}

	const ax = createServerAxios();
	const res = await ax.get(`/media/stream?path=${encodeURIComponent(path)}`, {
		headers: { Range: request.headers.get("range") || "" },
		responseType: "stream",
	});

	const headers = new Headers();
	Object.entries(res.headers).forEach(([key, value]) => {
		if (typeof value === "string") {
			headers.set(key, value);
		}
	});

	return new NextResponse(res.data, { status: res.status, headers });
}
