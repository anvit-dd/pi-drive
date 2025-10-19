import { getUserFromToken } from "@/lib/auth-server-component";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const user = await getUserFromToken();

		if (!user) {
			return NextResponse.json(
				{
					error: "Unauthorized",
					message: "No valid authentication token found",
				},
				{ status: 401 }
			);
		}

		const { password: _ignored, ...safeUser } = user;
		void _ignored;

		return NextResponse.json({ user: safeUser }, { status: 200 });
	} catch (error) {
		console.error("Error fetching user:", error);
		return NextResponse.json(
			{ error: "Internal Server Error", message: "Failed to fetch user data" },
			{ status: 500 }
		);
	}
}
