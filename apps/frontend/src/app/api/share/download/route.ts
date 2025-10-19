import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerAxios } from "@/lib/axios";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const linkId = searchParams.get("linkId");
		const password = searchParams.get("password");
		const id = searchParams.get("id");

		if (!linkId) {
			return new NextResponse(null, { status: 400 });
		}

		const sharedItem = await prisma.sharedItems.findUnique({
			where: { linkId },
		});

		if (!sharedItem) {
			return new NextResponse(null, { status: 404 });
		}

		if (new Date() > sharedItem.expiresAt) {
			return new NextResponse(null, { status: 410 });
		}

		if (sharedItem.password) {
			if (!password) {
				const headers = new Headers();
				headers.set("X-Requires-Password", "true");
				return new NextResponse(null, { status: 401, headers });
			}

			const isValidPassword = await bcrypt.compare(
				password,
				sharedItem.password
			);
			if (!isValidPassword) {
				return new NextResponse(null, { status: 401 });
			}
		}

		const ax = createServerAxios();
		let encodedId: string;
		if (id) {
			encodedId = id;
		} else {
			const itemData = [
				{
					id: sharedItem.itemPath,
					name: sharedItem.itemPath.split("/").pop() || "download",
					is_dir: false,
				},
			];
			encodedId = Buffer.from(JSON.stringify(itemData)).toString("base64");
		}
		const res = await ax.get(`/share/download`, {
			params: {
				user_id: sharedItem.userId,
				id: encodedId,
			},
			responseType: "stream",
		});

		const headers = new Headers();
		for (const [key, value] of Object.entries(res.headers)) {
			headers.set(key, value as string);
		}

		return new NextResponse(res.data, {
			status: res.status,
			headers: headers,
		});
	} catch (error) {
		console.error("Error downloading shared file:", error);
		return NextResponse.json(
			{ error: "Failed to download file" },
			{ status: 500 }
		);
	}
}

export async function HEAD(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const linkId = searchParams.get("linkId");
		const password = searchParams.get("password");
		const id = searchParams.get("id");

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

		const ax = createServerAxios();
		const encodedId = id
			? id
			: Buffer.from(
					JSON.stringify([
						{
							id: sharedItem.itemPath,
							name: sharedItem.itemPath.split("/").pop() || "download",
							is_dir: false,
						},
					])
			  ).toString("base64");

		const res = await ax.head("/share/download", {
			params: {
				user_id: sharedItem.userId,
				id: encodedId,
			},
		});

		const headers = new Headers();
		for (const [key, value] of Object.entries(res.headers)) {
			headers.set(key, value as string);
		}

		return new NextResponse(null, {
			status: res.status,
			headers,
		});
	} catch (error) {
		console.error("Error retrieving shared file metadata:", error);
		return new NextResponse(null, { status: 500 });
	}
}
