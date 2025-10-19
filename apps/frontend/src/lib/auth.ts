import { SignJWT, jwtVerify } from "jose";

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
  exp: number;
  iat: number;
  jti: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function generateToken(user: User): Promise<string> {
  // Generate a simple JTI for client-side tokens
  const jti = Math.random().toString(36).substring(2, 15);

  const token = await new SignJWT({
    user,
    sub: user.id,
    email: user.email,
    role: "authenticated",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // Validate required fields
    if (!payload.sub || !payload.jti) {
      return null;
    }

    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "client-auth-token") {
      return decodeURIComponent(value);
    }
  }

  return null;
}

export async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}

export async function isTokenExpired(token: string): Promise<boolean> {
  try {
    const payload = await verifyToken(token);
    if (!payload) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime + 60; // 1 minute buffer
  } catch {
    return true;
  }
}

export async function getValidToken(): Promise<string | null> {
  let token = getTokenFromCookie();

  if (!token) return null;

  // Check if token is expired or will expire soon
  if (await isTokenExpired(token)) {
    // Try to refresh the token
    const refreshed = await refreshToken();
    if (refreshed) {
      // Get the new token
      token = getTokenFromCookie();
    } else {
      // Refresh failed - don't immediately clear tokens
      // Let the current token expire naturally, user can still use the app
      // Only clear if we get a 401 from the server
      console.warn(
        "Token refresh failed, using existing token until it expires"
      );
    }
  }

  return token;
}

export function clearTokenFromCookie() {
  if (typeof document === "undefined") return;
  document.cookie =
    "client-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
