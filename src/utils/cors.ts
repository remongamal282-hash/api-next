import type { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

const allowedHeaders = ["Content-Type", "Authorization", "X-CSRF-Token"];
const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

export function resolveCorsOrigin(origin: string | null): string | null {
  if (!origin) return null;
  return env.CORS_ALLOWED_ORIGINS.includes(origin) ? origin : null;
}

export function applyCorsHeaders(response: NextResponse, origin: string | null) {
  if (!origin) return response;

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", allowedMethods.join(","));
  response.headers.set("Access-Control-Allow-Headers", allowedHeaders.join(","));
  response.headers.set("Access-Control-Max-Age", "600");
  response.headers.set("Vary", "Origin");
  return response;
}

export function ensureCors(request: NextRequest): { origin: string | null; blocked: boolean } {
  const origin = request.headers.get("origin");
  if (!origin) return { origin: null, blocked: false };

  const allowedOrigin = resolveCorsOrigin(origin);
  return { origin: allowedOrigin, blocked: !allowedOrigin };
}
