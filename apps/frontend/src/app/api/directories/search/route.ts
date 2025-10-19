import { createServerAxios } from "@/lib/axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const query = searchParams.get("query");

		if (!query) {
			return NextResponse.json(
				{ error: "Search query is required" },
				{ status: 400 }
			);
		}

		const ax = createServerAxios();
		const res = await ax.get("/directories/search", {
			params: { query },
		});

		return NextResponse.json({ results: res.data }, { status: 200 });
	} catch {
		return NextResponse.json(
			{ error: "Failed to search contents" },
			{ status: 500 }
		);
	}
}
