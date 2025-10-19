import { createServerAxios } from "@/lib/axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const path = searchParams.get("path");

		if (!path) {
			return NextResponse.json(
				{ error: "Directory path is required" },
				{ status: 400 }
			);
		}

		const ax = createServerAxios();
		const res = await ax.get("/directories", {
			params: { path },
		});

		return NextResponse.json({ contents: res.data }, { status: 200 });
	} catch (err: unknown) {
		const error = err as {
			response?: { data?: { message?: string }; status?: number };
		};
		console.log(error);
		return NextResponse.json(
			{ error: error.response?.data?.message || "An error occurred" },
			{ status: error.response?.status || 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json().catch(() => null)) as {
			path?: string;
		} | null;

		const path = body?.path ?? new URL(request.url).searchParams.get("path");

		if (!path) {
			return NextResponse.json(
				{ error: "Directory path is required" },
				{ status: 400 }
			);
		}

		const ax = createServerAxios();
		const res = await ax.post("/directories", null, {
			params: { path },
		});

		return NextResponse.json(res.data, { status: 201 });
	} catch (err: unknown) {
		const error = err as {
			response?: { data?: { message?: string }; status?: number };
		};
		console.log(error);
		return NextResponse.json(
			{ error: error.response?.data?.message || "An error occurred" },
			{ status: error.response?.status || 500 }
		);
	}
}
