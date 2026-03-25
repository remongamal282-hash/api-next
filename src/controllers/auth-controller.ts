import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { checkRateLimit } from "@/middlewares/rate-limit";
import { authenticateUser, issueTokensForUser, registerUser, revokeRefreshToken, rotateRefreshToken } from "@/services/auth-service";
import { applyCorsHeaders, ensureCors } from "@/utils/cors";
import { clearAuthCookies, CSRF_COOKIE_NAME, REFRESH_COOKIE_NAME, setCsrfCookie, setRefreshTokenCookie } from "@/utils/cookies";
import { log } from "@/utils/logger";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const registerSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(255)
});

function applyCorsOrBlock(request: NextRequest) {
  const cors = ensureCors(request);
  if (cors.blocked) {
    return {
      response: NextResponse.json({ message: "Origin not allowed." }, { status: 403 }),
      origin: null
    };
  }

  return { response: null, origin: cors.origin };
}

function withCors(response: NextResponse, origin: string | null) {
  return applyCorsHeaders(response, origin);
}

export async function handleLogin(request: NextRequest) {
  const corsResult = applyCorsOrBlock(request);
  if (corsResult.response) return corsResult.response;

  const rate = checkRateLimit(request, "auth-login", 10, 15 * 60 * 1000);
  if (!rate.allowed) {
    return withCors(
      NextResponse.json({ message: "Too many requests." }, { status: 429 }),
      corsResult.origin
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withCors(NextResponse.json({ message: "Invalid JSON body." }, { status: 400 }), corsResult.origin);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      NextResponse.json({ message: "Validation failed.", errors: parsed.error.flatten().fieldErrors }, { status: 422 }),
      corsResult.origin
    );
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);
  if (!user) {
    log("warn", "Failed login attempt", { email: parsed.data.email });
    return withCors(NextResponse.json({ message: "Invalid credentials." }, { status: 401 }), corsResult.origin);
  }

  const tokens = await issueTokensForUser(user.id, user.role);
  const csrfToken = uuidv4();
  const response = NextResponse.json({
    accessToken: tokens.access.token,
    tokenType: "Bearer",
    expiresIn: tokens.access.expiresInSeconds,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });

  setRefreshTokenCookie(response, tokens.refresh.token, tokens.refresh.expiresInSeconds);
  setCsrfCookie(response, csrfToken, tokens.refresh.expiresInSeconds);
  return withCors(response, corsResult.origin);
}

export async function handleRegister(request: NextRequest) {
  const corsResult = applyCorsOrBlock(request);
  if (corsResult.response) return corsResult.response;

  const rate = checkRateLimit(request, "auth-register", 5, 15 * 60 * 1000);
  if (!rate.allowed) {
    return withCors(
      NextResponse.json({ message: "Too many requests." }, { status: 429 }),
      corsResult.origin
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withCors(NextResponse.json({ message: "Invalid JSON body." }, { status: 400 }), corsResult.origin);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      NextResponse.json({ message: "Validation failed.", errors: parsed.error.flatten().fieldErrors }, { status: 422 }),
      corsResult.origin
    );
  }

  const result = await registerUser(parsed.data);
  if (!result.ok) {
    return withCors(NextResponse.json({ message: result.message }, { status: 409 }), corsResult.origin);
  }

  return withCors(NextResponse.json({ user: result.user }, { status: 201 }), corsResult.origin);
}

export async function handleRefresh(request: NextRequest) {
  const corsResult = applyCorsOrBlock(request);
  if (corsResult.response) return corsResult.response;

  const csrfHeader = request.headers.get("x-csrf-token") ?? "";
  const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value ?? "";
  if (!csrfHeader || csrfHeader !== csrfCookie) {
    return withCors(NextResponse.json({ message: "Invalid CSRF token." }, { status: 403 }), corsResult.origin);
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return withCors(NextResponse.json({ message: "Unauthorized." }, { status: 401 }), corsResult.origin);
  }

  const rotated = await rotateRefreshToken(refreshToken);
  if (!rotated.ok) {
    return withCors(NextResponse.json({ message: rotated.message }, { status: 401 }), corsResult.origin);
  }

  const csrfToken = uuidv4();
  const response = NextResponse.json({
    accessToken: rotated.access.token,
    tokenType: "Bearer",
    expiresIn: rotated.access.expiresInSeconds
  });

  setRefreshTokenCookie(response, rotated.refresh.token, rotated.refresh.expiresInSeconds);
  setCsrfCookie(response, csrfToken, rotated.refresh.expiresInSeconds);
  return withCors(response, corsResult.origin);
}

export async function handleLogout(request: NextRequest) {
  const corsResult = applyCorsOrBlock(request);
  if (corsResult.response) return corsResult.response;

  const csrfHeader = request.headers.get("x-csrf-token") ?? "";
  const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value ?? "";
  if (!csrfHeader || csrfHeader !== csrfCookie) {
    return withCors(NextResponse.json({ message: "Invalid CSRF token." }, { status: 403 }), corsResult.origin);
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (refreshToken) {
    const rotated = await rotateRefreshToken(refreshToken);
    if (rotated.ok) {
      await revokeRefreshToken(rotated.user.id);
    }
  }

  const response = NextResponse.json({ message: "Logged out." });
  clearAuthCookies(response);
  return withCors(response, corsResult.origin);
}

