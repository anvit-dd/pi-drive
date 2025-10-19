import { createServerAxios } from "@/lib/axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json().catch(() => null)) as {
			path?: string;
		} | null;
		const path = body?.path ?? new URL(request.url).searchParams.get("path");

		if (!path) {
			return NextResponse.json(
				{ error: "File path is required" },
				{ status: 400 }
			);
		}

		const ax = createServerAxios();
		const res = await ax.post("/files", null, {
			params: { path },
		});

		return NextResponse.json(res.data, { status: res.status });
	} catch (err: unknown) {
		const error = err as {
			response?: { data?: { message?: string }; status?: number };
		};
		return NextResponse.json(
			{ error: error.response?.data?.message || "Failed to create file" },
			{ status: error.response?.status || 500 }
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const payload = await request.json();
		if (!payload) {
			return NextResponse.json(
				{ error: "Invalid items provided" },
				{ status: 400 }
			);
		}

		const ax = createServerAxios();
		const res = await ax.delete("/files", {
			data: { items: payload.items ?? payload },
		});

		return NextResponse.json(res.data, { status: 200 });
	} catch (err: unknown) {
		const error = err as {
			response?: { data?: { message?: string }; status?: number };
		};
		return NextResponse.json(
			{ error: error.response?.data?.message || "Failed to delete items" },
			{ status: error.response?.status || 500 }
		);
	}
}
