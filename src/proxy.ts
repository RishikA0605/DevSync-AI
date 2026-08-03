import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const authRoutes = ["/auth"];
const protectedRoutes = ["/dashboard", "/workspace"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all API auth routes to pass through
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!token;
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.includes(pathname);

  // Redirect logged-in users away from auth page
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect logged-out users trying to access protected routes
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
