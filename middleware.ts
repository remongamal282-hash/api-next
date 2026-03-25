import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/session";
import { getSecurityHeaders } from "@/utils/security-headers";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedPath =
    pathname === "/" || pathname.startsWith("/ProdectWebController") || pathname.startsWith("/prodects");

  if (!isProtectedPath) {
    const response = NextResponse.next();
    const headers = getSecurityHeaders();
    Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token);

  if (!session?.simple_auth) {
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    const headers = getSecurityHeaders();
    Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }

  const response = NextResponse.next();
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: ["/", "/ProdectWebController/:path*", "/prodects/:path*", "/api/:path*"]
};
