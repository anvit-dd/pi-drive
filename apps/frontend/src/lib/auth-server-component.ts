import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
	process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);

export interface User {
	id: string;
	email: string;
	name?: string;
	password: string;
	provider: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface JWTPayload {
	user: User;
	sub: string;
	email?: string;
	role: string;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

export async function getUserFromToken(): Promise<User | null> {
	try {
		const token = await getTokenFromCookie();

		if (!token) {
			return null;
		}

		const payload = await verifyToken(token);
		if (!payload) {
			return null;
		}

		const dbUser = await prisma.user.findUnique({
			where: { id: payload.sub },
		});

		if (!dbUser) {
			return null;
		}

		return payload.user || null;
	} catch {
		return null;
	}
}

async function getTokenFromCookie(): Promise<string | null> {
	try {
		const cookieStore = await cookies();
		return cookieStore.get("auth-token")?.value || null;
	} catch {
		return null;
	}
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		return payload as unknown as JWTPayload;
	} catch {
		return null;
	}
}

export async function setAuthCookie(token: string) {
	try {
		const cookieStore = await cookies();
		const isProduction = process.env.NODE_ENV === "production";

		const cookieOptions = {
			httpOnly: true,
			secure: isProduction,
			sameSite: "lax" as const,
			path: "/",
			maxAge: 24 * 60 * 60, // 24 hours
		};

		cookieStore.set("auth-token", token, cookieOptions);
	} catch (error) {
		throw error;
	}
}

export async function clearAuthCookie() {
	try {
		const cookieStore = await cookies();
		cookieStore.delete("auth-token");
		cookieStore.delete("refresh-token");
	} catch (error) {
		throw error;
	}
}

export async function setAuthTokens(tokens: AuthTokens) {
	await Promise.all([
		setAuthCookie(tokens.accessToken),
		setRefreshCookie(tokens.refreshToken),
	]);
}

export async function setRefreshCookie(token: string) {
	try {
		const cookieStore = await cookies();
		const isProduction = process.env.NODE_ENV === "production";

		const cookieOptions = {
			httpOnly: true,
			secure: isProduction,
			sameSite: "lax" as const,
			path: "/",
			maxAge: 30 * 24 * 60 * 60, // 30 days
		};

		cookieStore.set("refresh-token", token, cookieOptions);
	} catch (error) {
		throw error;
	}
}

export async function getRefreshTokenFromCookie(): Promise<string | null> {
	try {
		const cookieStore = await cookies();
		return cookieStore.get("refresh-token")?.value || null;
	} catch {
		return null;
	}
}
