import { NextResponse } from "next/server";
import { getUserFromToken, clearAuthCookie } from "@/lib/auth-server-component";
import { revokeAllUserRefreshTokens } from "@/lib/auth-server";

export async function POST() {
  try {
    const user = await getUserFromToken();

    if (user) {
      await revokeAllUserRefreshTokens(user.id);
    }

    await clearAuthCookie();

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.set("client-auth-token", "", {
      httpOnly: false,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
