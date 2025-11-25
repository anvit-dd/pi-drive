import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

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

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);

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

export function getTokenFromCookieForMiddleware(
  request: NextRequest
): string | null {
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

    return cookies["client-auth-token"] || cookies["auth-token"] || null;
  } catch {
    return null;
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
