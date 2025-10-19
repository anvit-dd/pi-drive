import { NextResponse, NextRequest } from "next/server";
import { createServerAxios } from "@/lib/axios";
import { isAxiosError } from "axios";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const file_path = searchParams.get("file_path");
		const user_id = searchParams.get("user_id");
		const linkId = searchParams.get("linkId");
		const password = searchParams.get("password");

		if (!file_path || !user_id || !linkId) {
			return NextResponse.json(
				{ error: "Missing required parameters" },
				{ status: 400 }
			);
		}

		const backendParams = new URLSearchParams();
		backendParams.set("path", file_path);
		backendParams.set("user_id", user_id);
		backendParams.set("linkId", linkId);
		if (password) {
			backendParams.set("password", password);
		}

		const ax = createServerAxios();
		const res = await ax.get(`/share/stream?${backendParams.toString()}`, {
			headers: {
				Range: request.headers.get("range") || "",
			},
			responseType: "stream",
		});

		const headers = new Headers();
		Object.entries(res.headers).forEach(([key, value]) => {
			if (typeof value === "string") {
				headers.set(key, value);
			}
		});

		return new NextResponse(res.data, { status: res.status, headers });
	} catch (error) {
		console.error("Error streaming shared file:", error);
		const status = isAxiosError(error) ? error.response?.status || 500 : 500;
		return NextResponse.json({ error: "Failed to stream file" }, { status });
	}
}
