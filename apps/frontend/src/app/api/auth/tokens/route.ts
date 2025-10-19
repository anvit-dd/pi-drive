"use server";

import { NextResponse } from "next/server";
import {
  getUserRefreshTokens,
  revokeRefreshToken,
  RefreshTokenInfo,
} from "@/lib/auth-server";
import { getUserFromToken } from "@/lib/auth-server-component";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens: RefreshTokenInfo[] = await getUserRefreshTokens(user.id);

    return NextResponse.json({
      tokens,
      count: tokens.length,
    });
  } catch (error) {
    console.error("Failed to get refresh tokens:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tokenId } = await request.json();

    if (!tokenId) {
      return NextResponse.json(
        { error: "Token ID is required" },
        { status: 400 }
      );
    }

    const tokens = await getUserRefreshTokens(user.id);
    const tokenExists = tokens.some((token) => token.id === tokenId);

    if (!tokenExists) {
      return NextResponse.json(
        { error: "Token not found or already revoked" },
        { status: 404 }
      );
    }

    await revokeRefreshToken(tokenId);

    return NextResponse.json({
      success: true,
      message: "Token revoked successfully",
    });
  } catch (error) {
    console.error("Failed to revoke token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
