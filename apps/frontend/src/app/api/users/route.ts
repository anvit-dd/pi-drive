import { createServerAxios } from "@/lib/axios";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const ax = createServerAxios();
		const res = await ax.get("/users");
		return NextResponse.json(
			{ message: "Success", ...res.data },
			{ status: 200 }
		);
	} catch (err: unknown) {
		const error = err as {
			response?: { data?: { message?: string }; status?: number };
		};
		return NextResponse.json(
			{ error: error.response?.data?.message || "An error occurred" },
			{ status: error.response?.status || 500 }
		);
	}
}
