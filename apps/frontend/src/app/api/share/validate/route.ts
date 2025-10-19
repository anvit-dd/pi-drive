import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const linkId = searchParams.get("linkId");
		const password = searchParams.get("password");

		if (!linkId) {
			return NextResponse.json(
				{ error: "Link ID is required" },
				{ status: 400 }
			);
		}

		const sharedItem = await prisma.sharedItems.findUnique({
			where: { linkId },
			include: {
				user: {
					select: {
						name: true,
						email: true,
					},
				},
			},
		});

		if (!sharedItem) {
			return NextResponse.json(
				{ error: "Share link not found" },
				{ status: 404 }
			);
		}

		// Check if link has expired
		if (new Date() > sharedItem.expiresAt) {
			return NextResponse.json(
				{ error: "Share link has expired" },
				{ status: 410 }
			);
		}

		// Check password if required
		if (sharedItem.password) {
			if (!password) {
				return NextResponse.json(
					{ error: "Password required", requiresPassword: true },
					{ status: 401 }
				);
			}

			const isValidPassword = await bcrypt.compare(
				password,
				sharedItem.password
			);
			if (!isValidPassword) {
				return NextResponse.json(
					{ error: "Invalid password" },
					{ status: 401 }
				);
			}
		}

		return NextResponse.json({
			itemPath: sharedItem.itemPath,
			sharedBy: sharedItem.user.name || sharedItem.user.email,
			userId: sharedItem.userId,
			createdAt: sharedItem.createdAt,
			expiresAt: sharedItem.expiresAt,
			requiresPassword: !!sharedItem.password,
			isFile: sharedItem.itemPath.split("/").pop()?.includes(".") ?? false,
		});
	} catch (e) {
		console.log(e);
		return NextResponse.json(
			{ error: "Failed to validate share link!" },
			{ status: 500 }
		);
	}
}
