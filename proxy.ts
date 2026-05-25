import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Extract persistent authorization token from request cookies
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Verify if token exists and is cryptographically unexpired
  let isAuthenticated = false;
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        // Decode base64 payload safely in Next.js Edge Runtime
        const payload = JSON.parse(atob(parts[1]));
        const isExpired = payload.exp && Date.now() >= payload.exp * 1000;
        if (!isExpired) {
          isAuthenticated = true;
        }
      }
    } catch (e) {
      // Invalid token structure
    }
  }

  // Identify accessible non-authenticated gateway targets
  const isPublicPath = 
    pathname === "/login" || 
    pathname === "/signup" || 
    pathname.startsWith("/api/auth");

  // If an active user requests authorization screens, automatically bounce them to operational view
  if (isPublicPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If an unverified request targets internal workspace tools, securely redirect to login prompt
  if (!isPublicPath && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Target specific route parameter matches to intercept
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/projects/:path*",
    "/planner/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
  ],
};
