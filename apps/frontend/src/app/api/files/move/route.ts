import { createServerAxios } from "@/lib/axios";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
	try {
		const { items, destination } = await request.json();

		if (!destination || !Array.isArray(items) || items.length === 0) {
			return NextResponse.json(
				{ error: "Invalid payload received" },
				{ status: 400 }
			);
		}

		const ax = createServerAxios();
		const res = await ax.patch("/files/move", {
			items,
			destination,
		});

		return NextResponse.json(res.data, { status: 200 });
	} catch (err: unknown) {
		const error = err as {
			response?: {
				data?: { detail?: string; message?: string };
				status?: number;
			};
		};
		return NextResponse.json(
			{
				error:
					error.response?.data?.detail ||
					error.response?.data?.message ||
					"Failed to move items",
			},
			{ status: error.response?.status || 500 }
		);
	}
}
