"use server";

import { NextResponse } from "next/server";
import { refreshAccessToken, AuthError } from "@/lib/auth-server";
import {
  getRefreshTokenFromCookie,
  setAuthTokens,
} from "@/lib/auth-server-component";

export async function POST() {
  try {
    const refreshToken = await getRefreshTokenFromCookie();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 }
      );
    }

    const tokens = await refreshAccessToken(refreshToken);

    if (!tokens) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    await setAuthTokens(tokens);

    const response = NextResponse.json({
      message: "Tokens refreshed successfully",
      expiresIn: tokens.expiresIn,
    });

    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set("client-auth-token", tokens.accessToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: tokens.expiresIn,
    });

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
