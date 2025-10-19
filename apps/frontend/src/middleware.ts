import { NextResponse, type NextRequest } from "next/server";
import { getUserFromTokenForMiddleware } from "@/lib/auth-server";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (pathname.startsWith("/s/")) {
		return NextResponse.next();
	}

	const user = await getUserFromTokenForMiddleware(request);

	const protectedRoutes = ["/home", "/settings"];
	const isProtectedRoute = protectedRoutes.some((route) =>
		pathname.startsWith(route)
	);

	if (user && pathname === "/") {
		return NextResponse.redirect(new URL("/home", request.url));
	}

	if (!user && pathname === "/") {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	if (!user && isProtectedRoute) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	if (user && (pathname.startsWith("/login") || pathname.startsWith("/auth"))) {
		return NextResponse.redirect(new URL("/home", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
};
