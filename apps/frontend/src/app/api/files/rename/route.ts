import { createServerAxios } from "@/lib/axios";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
	try {
		const { file_path, new_name } = await request.json();

		if (!file_path || !new_name) {
			return NextResponse.json(
				{ error: "Invalid payload received" },
				{ status: 400 }
			);
		}

		const ax = createServerAxios();
		const res = await ax.patch("/files/rename", {
			file_path,
			new_name,
		});

		return NextResponse.json(res.data, { status: 200 });
	} catch {
		return NextResponse.json(
			{ error: "Failed to rename item" },
			{ status: 500 }
		);
	}
}
