import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import { parseDurationMs } from "@/utils/time";
import { v4 as uuidv4 } from "uuid";

export type AccessTokenPayload = {
  sub: string;
  role: "ADMIN" | "USER" | "VIEWER";
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  type: "refresh";
  jti: string;
};

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
const accessTtlMs = parseDurationMs(env.JWT_ACCESS_TTL);
const refreshTtlMs = parseDurationMs(env.JWT_REFRESH_TTL);

export async function signAccessToken(userId: string, role: AccessTokenPayload["role"]) {
  const expiresAt = new Date(Date.now() + accessTtlMs);
  const token = await new SignJWT({ role, type: "access" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_TTL)
    .sign(accessSecret);

  return { token, expiresAt, expiresInSeconds: Math.floor(accessTtlMs / 1000) };
}

export async function signRefreshToken(userId: string) {
  const expiresAt = new Date(Date.now() + refreshTtlMs);
  const token = await new SignJWT({ type: "refresh", jti: uuidv4() })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_TTL)
    .sign(refreshSecret);

  return { token, expiresAt, expiresInSeconds: Math.floor(refreshTtlMs / 1000) };
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret);
    if (payload.type !== "access" || typeof payload.sub !== "string" || typeof payload.role !== "string") {
      return null;
    }

    return {
      sub: payload.sub,
      role: payload.role as AccessTokenPayload["role"],
      type: "access"
    };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret);
    if (payload.type !== "refresh" || typeof payload.sub !== "string" || typeof payload.jti !== "string") {
      return null;
    }

    return {
      sub: payload.sub,
      jti: payload.jti,
      type: "refresh"
    };
  } catch {
    return null;
  }
}

