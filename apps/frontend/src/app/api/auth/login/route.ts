import { NextRequest, NextResponse } from "next/server";
import { generateAuthTokens } from "@/lib/auth-server";
import { setAuthTokens } from "@/lib/auth-server-component";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

interface LoginRequestBody {
  email: string;
  password: string;
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

    let parsedBody: LoginRequestBody;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 }
      );
    }

    const { email, password } = parsedBody;
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const tokens = await generateAuthTokens({
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      password: user.password,
      provider: user.provider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    await setAuthTokens(tokens);

    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });
    console.log("USER HAS THE ROLE ", user.role)
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        provider: user.provider,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      expiresIn: tokens.expiresIn,
    });

    response.cookies.set("client-auth-token", tokens.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: tokens.expiresIn,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
