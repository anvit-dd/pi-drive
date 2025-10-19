import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
	process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);

const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
	process.env.REFRESH_TOKEN_SECRET ||
		"your-refresh-secret-key-change-this-in-production"
);

async function generateRandomBytes(length: number): Promise<string> {
	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		const array = new Uint8Array(length);
		crypto.getRandomValues(array);
		return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
			""
		);
	} else {
		let result = "";
		for (let i = 0; i < length; i++) {
			result += Math.floor(Math.random() * 256)
				.toString(16)
				.padStart(2, "0");
		}
		return result;
	}
}

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
	exp: number;
	iat: number;
	jti: string;
}

export interface RefreshTokenPayload {
	sub: string;
	exp: number;
	iat: number;
	jti: string;
	tokenType: "refresh";
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
}

export class AuthError extends Error {
	constructor(
		message: string,
		public code: string,
		public statusCode: number = 401
	) {
		super(message);
		this.name = "AuthError";
	}
}

export async function generateToken(user: User): Promise<string> {
	const jti = await generateRandomBytes(16);

	const token = await new SignJWT({
		user,
		sub: user.id,
		email: user.email,
		role: "authenticated",
	})
		.setProtectedHeader({ alg: "HS256" })
		.setAudience("authenticated")
		.setJti(jti)
		.setExpirationTime("24h")
		.setIssuedAt()
		.sign(JWT_SECRET);

	return token;
}

export async function generateRefreshToken(userId: string): Promise<string> {
	const jti = await generateRandomBytes(16);
	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

	const token = await new SignJWT({
		sub: userId,
		tokenType: "refresh",
	})
		.setProtectedHeader({ alg: "HS256" })
		.setJti(jti)
		.setExpirationTime("30d")
		.setIssuedAt()
		.sign(REFRESH_TOKEN_SECRET);

	try {
		await prisma.refreshToken.create({
			data: {
				token: jti,
				userId,
				expiresAt,
			},
		});
	} catch (error) {
		console.error("Failed to save refresh token:", error);
		throw new AuthError("Failed to create refresh token", "TOKEN_SAVE_FAILED");
	}

	return token;
}

export async function generateAuthTokens(user: User): Promise<AuthTokens> {
	const [accessToken, refreshToken] = await Promise.all([
		generateToken(user),
		generateRefreshToken(user.id),
	]);

	return {
		accessToken,
		refreshToken,
		expiresIn: 24 * 60 * 60, // 24 hours in seconds
	};
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET, {
			algorithms: ["HS256"],
		});

		if (!payload.sub || !payload.jti) {
			return null;
		}

		return payload as unknown as JWTPayload;
	} catch (error) {
		console.error("Token verification failed:", error);
		return null;
	}
}

export async function verifyRefreshToken(
	token: string
): Promise<RefreshTokenPayload | null> {
	try {
		const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET, {
			algorithms: ["HS256"],
		});

		if (!payload.sub || !payload.jti || payload.tokenType !== "refresh") {
			return null;
		}

		const dbToken = await prisma.refreshToken.findUnique({
			where: { token: payload.jti as string },
			include: { user: true },
		});

		if (!dbToken) {
			return null;
		}

		if (dbToken.isRevoked) {
			return null;
		}

		if (dbToken.expiresAt < new Date()) {
			await prisma.refreshToken.delete({
				where: { id: dbToken.id },
			});
			return null;
		}

		return payload as unknown as RefreshTokenPayload;
	} catch (error) {
		console.error("Refresh token verification failed:", error);
		return null;
	}
}

export async function refreshAccessToken(
	refreshToken: string
): Promise<AuthTokens | null> {
	try {
		const payload = await verifyRefreshToken(refreshToken);
		if (!payload) {
			throw new AuthError("Invalid refresh token", "INVALID_REFRESH_TOKEN");
		}

		// Get the database token to check user association
		const dbToken = await prisma.refreshToken.findUnique({
			where: { token: payload.jti as string },
			include: { user: true },
		});

		if (!dbToken || !dbToken.user) {
			throw new AuthError("User not found", "USER_NOT_FOUND");
		}

		const user: User = {
			...dbToken.user,
			name: dbToken.user.name || undefined,
		};

		const newTokens = await generateAuthTokens(user);

		await revokeRefreshToken(payload.jti as string);

		return newTokens;
	} catch (error) {
		if (error instanceof AuthError) {
			throw error;
		}
		throw new AuthError("Failed to refresh token", "REFRESH_FAILED");
	}
}

export async function getTokenFromCookie(): Promise<string | null> {
	throw new Error(
		"getTokenFromCookie is not available in Edge Runtime. Use getUserFromTokenForMiddleware instead."
	);
}

export async function getUserById(userId: string): Promise<User | null> {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				name: true,
				password: true,
				provider: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!user) return null;

		return {
			...user,
			name: user.name || undefined,
		};
	} catch (error) {
		console.error("Failed to get user by ID:", error);
		return null;
	}
}

export async function getUserFromToken(): Promise<User | null> {
	throw new Error(
		"getUserFromToken is not available in Edge Runtime. Use getUserFromTokenForMiddleware instead."
	);
}

export async function setAuthCookie() {
	throw new Error(
		"setAuthCookie is not available in Edge Runtime. Use setAuthCookie from auth-server-component instead."
	);
}

export async function setRefreshCookie() {
	throw new Error(
		"setRefreshCookie is not available in Edge Runtime. Use setRefreshCookie from auth-server-component instead."
	);
}

export async function setAuthTokens() {
	throw new Error(
		"setAuthTokens is not available in Edge Runtime. Use setAuthTokens from auth-server-component instead."
	);
}

export async function getRefreshTokenFromCookie(): Promise<string | null> {
	throw new Error(
		"getRefreshTokenFromCookie is not available in Edge Runtime. Use getRefreshTokenFromCookie from auth-server-component instead."
	);
}

export async function clearAuthCookie() {
	throw new Error(
		"clearAuthCookie is not available in Edge Runtime. Use clearAuthCookie from auth-server-component instead."
	);
}

export async function revokeRefreshToken(tokenJti: string): Promise<void> {
	try {
		await prisma.refreshToken.update({
			where: { token: tokenJti },
			data: { isRevoked: true },
		});
	} catch (error) {
		console.error("Failed to revoke refresh token:", error);
		throw new AuthError("Failed to revoke token", "REVOKE_FAILED");
	}
}

export async function revokeAllUserRefreshTokens(
	userId: string
): Promise<void> {
	try {
		await prisma.refreshToken.updateMany({
			where: { userId, isRevoked: false },
			data: { isRevoked: true },
		});
	} catch (error) {
		console.error("Failed to revoke all user refresh tokens:", error);
		throw new AuthError("Failed to revoke user tokens", "REVOKE_ALL_FAILED");
	}
}

export async function cleanupExpiredTokens(): Promise<number> {
	try {
		const result = await prisma.refreshToken.deleteMany({
			where: {
				OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
			},
		});
		return result.count;
	} catch (error) {
		console.error("Failed to cleanup expired tokens:", error);
		return 0;
	}
}

export interface RefreshTokenInfo {
	id: string;
	createdAt: Date;
	expiresAt: Date;
	updatedAt: Date;
}

export async function getUserRefreshTokens(
	userId: string
): Promise<RefreshTokenInfo[]> {
	try {
		const tokens = await prisma.refreshToken.findMany({
			where: {
				userId,
				isRevoked: false,
				expiresAt: { gt: new Date() },
			},
			select: {
				id: true,
				createdAt: true,
				expiresAt: true,
				updatedAt: true,
			},
			orderBy: { createdAt: "desc" },
		});
		return tokens;
	} catch (error) {
		console.error("Failed to get user refresh tokens:", error);
		return [];
	}
}

export async function getUserFromTokenForMiddleware(
	request: NextRequest
): Promise<User | null> {
	try {
		const token = getTokenFromCookieForMiddleware(request);

		if (!token) {
			return null;
		}

		const payload = await verifyToken(token);
		if (!payload) {
			return null;
		}

		return payload.user || null;
	} catch {
		return null;
	}
}

function getTokenFromCookieForMiddleware(request: NextRequest): string | null {
	try {
		const cookieHeader = request.headers.get("cookie");
		if (!cookieHeader) {
			return null;
		}

		const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
			const [key, value] = cookie.trim().split("=");
			acc[key] = value;
			return acc;
		}, {} as Record<string, string>);

		// Check both cookie names for compatibility
		return cookies["client-auth-token"] || cookies["auth-token"] || null;
	} catch {
		return null;
	}
}
