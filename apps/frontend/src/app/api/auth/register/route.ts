import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/auth-server";
import { setAuthCookie } from "@/lib/auth-server-component";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

interface RegisterRequestBody {
	email: string;
	password: string;
	name?: string;
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.text();
		if (!body || body.trim() === "") {
			return NextResponse.json(
				{ error: "Request body is empty" },
				{ status: 400 }
			);
		}

		let parsedBody: RegisterRequestBody;
		try {
			parsedBody = JSON.parse(body);
		} catch {
			return NextResponse.json(
				{ error: "Invalid JSON format" },
				{ status: 400 }
			);
		}

		const { email, password, name } = parsedBody;
		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email and password are required" },
				{ status: 400 }
			);
		}

		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "User already exists" },
				{ status: 409 }
			);
		}

		const hashedPassword = await bcrypt.hash(password, 12);

		// Determine role: first user becomes ADMIN, others are USER
		const userCount = await prisma.user.count();
		const role: Role = userCount === 0 ? Role.ADMIN : Role.USER;

		const newUser = await prisma.user.create({
			data: {
				email,
				name: name || email.split("@")[0],
				password: hashedPassword,
				provider: "local",
				role,
			},
		});

		const token = await generateToken({
			...newUser,
			name: newUser.name || undefined,
		});

		await setAuthCookie(token);

		const response = NextResponse.json({
			token,
			user: {
				id: newUser.id,
				email: newUser.email,
				created_at: newUser.createdAt.toISOString(),
				last_sign_in_at: new Date().toISOString(),
				user_metadata: {
					name: newUser.name,
					provider: newUser.provider,
					role: newUser.role,
				},
			},
		});

		response.cookies.set("client-auth-token", token, {
			httpOnly: false,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60 * 24,
		});

		return response;
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
