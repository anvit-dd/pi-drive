import { NextResponse, NextRequest } from "next/server";
import { createServerAxios } from "@/lib/axios";
import { isAxiosError } from "axios";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const image_path = searchParams.get("image_path");
		const user_id = searchParams.get("user_id");
		const linkId = searchParams.get("linkId");
		const password = searchParams.get("password");

		if (!image_path || !user_id || !linkId) {
			return NextResponse.json(
				{ error: "Missing required parameters" },
				{ status: 400 }
			);
		}

		const backendParams = new URLSearchParams();
		backendParams.set("path", image_path);
		backendParams.set("user_id", user_id);
		backendParams.set("linkId", linkId);
		if (password) {
			backendParams.set("password", password);
		}

		const ax = createServerAxios();
		const res = await ax.get(`/share/thumbnails?${backendParams.toString()}`, {
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
	} catch (error) {
		console.error("Error fetching shared thumbnail:", error);
		const status = isAxiosError(error) ? error.response?.status || 500 : 500;
		return NextResponse.json(
			{ error: "Failed to fetch thumbnail" },
			{ status }
		);
	}
}
