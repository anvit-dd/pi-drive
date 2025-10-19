import { createServerAxios } from "@/lib/axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const path = searchParams.get("path") || "";

		const formData = await request.formData();
		const file = formData.get("file");

		if (!(file instanceof File)) {
			return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
		}

		const forwarded = new FormData();
		forwarded.append("file", file);

		const ax = createServerAxios();
		const response = await ax.post("/files/upload", forwarded, {
			params: { path },
			headers: { "Content-Type": "multipart/form-data" },
		});

		return NextResponse.json(response.data, { status: response.status });
	} catch (error: unknown) {
		if (error && typeof error === "object" && "response" in error) {
			const axiosError = error as {
				response: { data?: { detail?: string }; status: number };
			};
			return NextResponse.json(
				{ error: axiosError.response.data?.detail || "Upload failed" },
				{ status: axiosError.response.status }
			);
		}

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
