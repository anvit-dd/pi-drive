import { NextRequest, NextResponse } from "next/server";
import { createServerAxios } from "@/lib/axios";

export async function GET(request: NextRequest) {
	const id = request.nextUrl.searchParams.get("id");

	if (!id) {
		return new NextResponse(null, { status: 400 });
	}

	try {
		const ax = createServerAxios();
		const res = await ax.get(`/files/download?id=${encodeURIComponent(id)}`, {
			responseType: "stream",
		});

		const headers = new Headers();
		for (const [key, value] of Object.entries(res.headers)) {
			headers.set(key, value as string);
		}

		return new NextResponse(res.data, {
			status: res.status,
			headers,
		});
	} catch {
		return new NextResponse(null, { status: 500 });
	}
}

export async function HEAD(request: NextRequest) {
	const id = request.nextUrl.searchParams.get("id");

	if (!id) {
		return NextResponse.json({ error: "Missing id param" }, { status: 400 });
	}

	try {
		const ax = createServerAxios();
		const res = await ax.head("/files/download", {
			params: { id },
		});

		const headers = new Headers();
		for (const [key, value] of Object.entries(res.headers)) {
			headers.set(key, value as string);
		}

		return new NextResponse(null, {
			status: res.status,
			headers,
		});
	} catch {
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
