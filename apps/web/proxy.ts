import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ONLY_ROUTES = ["/login", "/register"];
const PROTECTED_ROUTES = ["/offers", "/orders", "/seller", "/profile"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has("vaultkix_auth");

  // Logged-in user tries to visit login/register → send home
  if (isAuthenticated && AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Unauthenticated user tries to visit protected page → send to login
  if (
    !isAuthenticated &&
    PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/offers/:path*",
    "/orders/:path*",
    "/seller/:path*",
    "/profile/:path*",
  ],
};
