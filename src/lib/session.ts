import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export const SESSION_COOKIE_NAME = "simple_session";

const sessionSecret = new TextEncoder().encode(env.SESSION_SECRET);

export type SimpleSession = {
  sid: string;
  simple_auth: true;
  simple_auth_user: string;
  simple_auth_user_id: number;
};

async function signSession(session: SimpleSession): Promise<string> {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(sessionSecret);
}

export async function verifySession(token: string | undefined): Promise<SimpleSession | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSecret);
    if (
      payload.simple_auth !== true ||
      typeof payload.simple_auth_user !== "string" ||
      typeof payload.simple_auth_user_id !== "number" ||
      typeof payload.sid !== "string"
    ) {
      return null;
    }

    return {
      sid: payload.sid,
      simple_auth: true,
      simple_auth_user: payload.simple_auth_user,
      simple_auth_user_id: payload.simple_auth_user_id
    };
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(request: NextRequest): Promise<SimpleSession | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return verifySession(token);
}

export async function getSessionFromCookies(): Promise<SimpleSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySession(token);
}

export async function setSessionCookie(response: NextResponse, session: SimpleSession): Promise<void> {
  const token = await signSession(session);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
