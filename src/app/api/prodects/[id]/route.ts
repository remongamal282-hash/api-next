import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  prodectNotFoundResponse,
  tooManyRequestsResponse,
  unauthorizedApiKeyResponse,
  unexpectedServerErrorResponse,
  validationFailedResponse
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { deleteImageFile } from "@/lib/upload";
import { updateProdectApiSchema } from "@/lib/validation";

export const runtime = "nodejs";

function parseId(rawId: string): number | null {
  const parsed = Number(rawId);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function checkReadLimit(request: NextRequest) {
  const ip = getClientIp(request);
  return consumeRateLimit("api-read", ip, 60, 60_000);
}

function checkWriteLimit(request: NextRequest) {
  const identity = request.headers.get("x-api-key") || getClientIp(request);
  return consumeRateLimit("api-write", identity, 5, 60_000);
}

function hasValidApiKey(request: NextRequest) {
  const provided = request.headers.get("x-api-key");
  return provided === env.ADMIN_API_KEY;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const rate = checkReadLimit(request);
  if (!rate.allowed) {
    return tooManyRequestsResponse(rate.retryAfter);
  }

  const { id } = await context.params;
  const prodectId = parseId(id);
  if (!prodectId) return prodectNotFoundResponse();

  try {
    const prodect = await prisma.prodects.findUnique({
      where: { id: prodectId }
    });

    if (!prodect) return prodectNotFoundResponse();
    return NextResponse.json(prodect);
  } catch {
    return unexpectedServerErrorResponse();
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const rate = checkWriteLimit(request);
  if (!rate.allowed) {
    return tooManyRequestsResponse(rate.retryAfter);
  }

  if (!hasValidApiKey(request)) {
    return unauthorizedApiKeyResponse();
  }

  const { id } = await context.params;
  const prodectId = parseId(id);
  if (!prodectId) return prodectNotFoundResponse();

  try {
    const body = await request.json();
    const parsed = updateProdectApiSchema.safeParse(body);
    if (!parsed.success) {
      return validationFailedResponse(parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.prodects.findUnique({ where: { id: prodectId } });
    if (!existing) return prodectNotFoundResponse();

    const updated = await prisma.prodects.update({
      where: { id: prodectId },
      data: {
        name: parsed.data.name ?? existing.name,
        descripshin: parsed.data.descripshin ?? existing.descripshin,
        price: parsed.data.price ?? existing.price
      }
    });

    return NextResponse.json(updated);
  } catch {
    return unexpectedServerErrorResponse();
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const rate = checkWriteLimit(request);
  if (!rate.allowed) {
    return tooManyRequestsResponse(rate.retryAfter);
  }

  if (!hasValidApiKey(request)) {
    return unauthorizedApiKeyResponse();
  }

  const { id } = await context.params;
  const prodectId = parseId(id);
  if (!prodectId) return prodectNotFoundResponse();

  try {
    const existing = await prisma.prodects.findUnique({ where: { id: prodectId } });
    if (!existing) return prodectNotFoundResponse();

    await prisma.prodects.delete({ where: { id: prodectId } });
    await deleteImageFile(existing.image);

    return NextResponse.json({ message: "Prodect deleted successfully." });
  } catch {
    return unexpectedServerErrorResponse();
  }
}
