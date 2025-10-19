import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerAxios } from "@/lib/axios";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const linkId = searchParams.get("linkId");
		const password = searchParams.get("password");
		const currentPath = searchParams.get("currentPath");

		if (!linkId) {
			return NextResponse.json(
				{ error: "Link ID is required" },
				{ status: 400 }
			);
		}

		const sharedItem = await prisma.sharedItems.findUnique({
			where: { linkId },
		});

		if (!sharedItem) {
			return NextResponse.json(
				{ error: "Share link not found" },
				{ status: 404 }
			);
		}

		if (new Date() > sharedItem.expiresAt) {
			return NextResponse.json(
				{ error: "Share link has expired" },
				{ status: 410 }
			);
		}

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

		const targetPath = currentPath || sharedItem.itemPath;

		const sharedPath = sharedItem.itemPath;
		const resolvedTargetPath = targetPath.startsWith("/")
			? targetPath.slice(1)
			: targetPath;
		const resolvedSharedPath = sharedPath.startsWith("/")
			? sharedPath.slice(1)
			: sharedPath;

		if (!resolvedTargetPath.startsWith(resolvedSharedPath)) {
			return NextResponse.json(
				{ error: "Access denied: path outside shared directory" },
				{ status: 403 }
			);
		}

		const ax = createServerAxios();
		const response = await ax.get(`/share/contents`, {
			params: {
				user_id: sharedItem.userId,
				item_path: targetPath,
			},
		});

		return NextResponse.json({ contents: response.data });
	} catch (error) {
		console.error("Error fetching shared directory contents:", error);
		return NextResponse.json(
			{ error: "Failed to fetch directory contents" },
			{ status: 500 }
		);
	}
}
