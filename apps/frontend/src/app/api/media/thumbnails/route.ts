import { createServerAxios } from "@/lib/axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl;
		const path = searchParams.get("path");

		if (!path) {
			return NextResponse.json(
				{ error: "Image path is required" },
				{ status: 400 }
			);
		}

		const ax = createServerAxios();
		const res = await ax.get("/media/thumbnails", {
			params: { path },
			responseType: "arraybuffer",
		});

		const contentType = res.headers["content-type"] || "image/jpeg";
		const contentLength = res.headers["content-length"];

		const headers = new Headers();
		headers.set("Content-Type", contentType);
		if (contentLength) headers.set("Content-Length", contentLength);

		return new NextResponse(new Uint8Array(res.data), {
			status: res.status,
			headers,
		});
	} catch {
		return NextResponse.json(
			{ error: "Failed to fetch thumbnail" },
			{ status: 500 }
		);
	}
}
