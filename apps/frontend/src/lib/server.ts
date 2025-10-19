import {
  getUserFromToken,
  type User,
  type AuthTokens,
  refreshAccessToken,
  cleanupExpiredTokens,
} from "./auth-server";
import { getRefreshTokenFromCookie } from "./auth-server-component";

export async function getServerUser(): Promise<User | null> {
  return await getUserFromToken();
}

export async function getServerSession() {
  const user = await getUserFromToken();
  return {
    user,
    access_token: user ? await generateAccessToken(user) : null,
  };
}

export async function refreshServerTokens(): Promise<AuthTokens | null> {
  try {
    const refreshToken = await getRefreshTokenFromCookie();
    if (!refreshToken) {
      return null;
    }

    return await refreshAccessToken(refreshToken);
  } catch (error) {
    console.error("Failed to refresh server tokens:", error);
    return null;
  }
}

export async function cleanupExpiredTokensJob(): Promise<{ cleaned: number }> {
  try {
    const cleaned = await cleanupExpiredTokens();
    return { cleaned };
  } catch (error) {
    console.error("Failed to cleanup expired tokens:", error);
    return { cleaned: 0 };
  }
}

async function generateAccessToken(user: User): Promise<string> {
  const { generateToken } = await import("./auth-server");
  return await generateToken(user);
}

export { type User, type AuthTokens };
