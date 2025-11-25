import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromTokenForMiddleware } from "@/lib/auth-middleware";
import bcrypt from "bcryptjs";

enum DurationUnit {
  SECONDS = "SECONDS",
  MINUTES = "MINUTES",
  HOURS = "HOURS",
  DAYS = "DAYS",
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemPath: string | null = searchParams.get("itemPath");
    const shareDuration: string | null = searchParams.get("shareDuration");
    const durationUnitParam: string | null = searchParams.get("durationUnit");
    const isFile: boolean = Boolean(searchParams.get("isFile"));
    const password: string | null = searchParams.get("password");

    if (
      itemPath == null ||
      shareDuration == null ||
      durationUnitParam == null
    ) {
      return NextResponse.json(
        { error: "Give required fields" },
        { status: 400 }
      );
    }

    console.log(durationUnitParam);

    if (
      !Object.values(DurationUnit).includes(durationUnitParam as DurationUnit)
    ) {
      return NextResponse.json(
        { error: "Invalid duration unit" },
        { status: 400 }
      );
    }
    const durationUnit = durationUnitParam as DurationUnit;

    const user = await getUserFromTokenForMiddleware(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const defaultDuration = 60;
    const defaultUnit = DurationUnit.MINUTES;

    const parsed = Number(shareDuration ?? "");
    const duration =
      Number.isFinite(parsed) && parsed > 0 ? parsed : defaultDuration;

    let ms = 0;
    const unit = durationUnit || defaultUnit;

    switch (unit) {
      case DurationUnit.SECONDS:
        ms = duration * 1000;
        break;
      case DurationUnit.MINUTES:
        ms = duration * 60 * 1000;
        break;
      case DurationUnit.HOURS:
        ms = duration * 60 * 60 * 1000;
        break;
      case DurationUnit.DAYS:
        ms = duration * 24 * 60 * 60 * 1000;
        break;
    }

    console.log(ms, "ms");
    const expiresAt = new Date(now.getTime() + ms);

    let hashed_password: string | null = null;
    if (password) {
      const saltRounds = 10;
      hashed_password = await bcrypt.hash(password, saltRounds);
    }

    const linkId = crypto.randomUUID().slice(0, 8).toLowerCase();
    console.log(isFile);
    await prisma.sharedItems.create({
      data: {
        userId: user.id,
        itemPath,
        linkId,
        shareDuration: duration,
        durationUnit: unit,
        isFile,
        createdAt: now,
        expiresAt,
        password: hashed_password,
      },
    });

    return NextResponse.json({ share_id: linkId }, { status: 201 });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { error: "Failed to create share link!" },
      { status: 500 }
    );
  }
}
