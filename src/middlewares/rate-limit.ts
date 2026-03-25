import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

export function checkRateLimit(
  request: NextRequest,
  bucket: string,
  limit = env.RATE_LIMIT_MAX,
  windowMs = env.RATE_LIMIT_WINDOW_MS
) {
  const identity = getClientIp(request);
  return consumeRateLimit(bucket, identity, limit, windowMs);
}

