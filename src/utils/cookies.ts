import type { NextResponse } from "next/server";

export const REFRESH_COOKIE_NAME = "refresh_token";
export const CSRF_COOKIE_NAME = "csrf_token";

export function setRefreshTokenCookie(
  response: NextResponse,
  token: string,
  maxAgeSeconds: number
): void {
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: maxAgeSeconds
  });
}

export function setCsrfCookie(response: NextResponse, token: string, maxAgeSeconds: number): void {
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: maxAgeSeconds
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: 0
  });
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: "",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: 0
  });
}

