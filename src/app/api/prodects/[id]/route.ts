import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  prodectNotFoundResponse,
  tooManyRequestsResponse,
  unexpectedServerErrorResponse,
  validationFailedResponse
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { checkRateLimit } from "@/middlewares/rate-limit";
import { deleteImageFile } from "@/lib/upload";
import { updateProdectApiSchema } from "@/lib/validation";
import { applyCorsHeaders, ensureCors } from "@/utils/cors";
import { isUuidV4 } from "@/utils/uuid";

export const runtime = "nodejs";

function parseId(rawId: string): string | null {
  return isUuidV4(rawId) ? rawId : null;
}

function checkReadLimit(request: NextRequest) {
  return checkRateLimit(request, "api-read", 60, 60_000);
}

function checkWriteLimit(request: NextRequest) {
  return checkRateLimit(request, "api-write", 5, 60_000);
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const cors = ensureCors(request);
  if (cors.blocked) {
    return NextResponse.json({ message: "Origin not allowed." }, { status: 403 });
  }

  const rate = checkReadLimit(request);
  if (!rate.allowed) {
    return applyCorsHeaders(tooManyRequestsResponse(rate.retryAfter), cors.origin);
  }

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return applyCorsHeaders(authResult, cors.origin);
  }

  const { id } = await context.params;
  const prodectId = parseId(id);
  if (!prodectId) return applyCorsHeaders(prodectNotFoundResponse(), cors.origin);

  try {
    const prodect = await prisma.prodects.findUnique({
      where: { id: prodectId }
    });

    if (!prodect) return applyCorsHeaders(prodectNotFoundResponse(), cors.origin);
    return applyCorsHeaders(NextResponse.json(prodect), cors.origin);
  } catch {
    return applyCorsHeaders(unexpectedServerErrorResponse(), cors.origin);
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const cors = ensureCors(request);
  if (cors.blocked) {
    return NextResponse.json({ message: "Origin not allowed." }, { status: 403 });
  }

  const rate = checkWriteLimit(request);
  if (!rate.allowed) {
    return applyCorsHeaders(tooManyRequestsResponse(rate.retryAfter), cors.origin);
  }

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return applyCorsHeaders(authResult, cors.origin);
  }

  const forbidden = requireRole(authResult, ["ADMIN"]);
  if (forbidden) {
    return applyCorsHeaders(forbidden, cors.origin);
  }

  const { id } = await context.params;
  const prodectId = parseId(id);
  if (!prodectId) return applyCorsHeaders(prodectNotFoundResponse(), cors.origin);

  try {
    const body = await request.json();
    const parsed = updateProdectApiSchema.safeParse(body);
    if (!parsed.success) {
      return applyCorsHeaders(validationFailedResponse(parsed.error.flatten().fieldErrors), cors.origin);
    }

    const existing = await prisma.prodects.findUnique({ where: { id: prodectId } });
    if (!existing) return applyCorsHeaders(prodectNotFoundResponse(), cors.origin);

    const updated = await prisma.prodects.update({
      where: { id: prodectId },
      data: {
        name: parsed.data.name ?? existing.name,
        descripshin: parsed.data.descripshin ?? existing.descripshin,
        price: parsed.data.price ?? existing.price
      }
    });

    return applyCorsHeaders(NextResponse.json(updated), cors.origin);
  } catch {
    return applyCorsHeaders(unexpectedServerErrorResponse(), cors.origin);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const cors = ensureCors(request);
  if (cors.blocked) {
    return NextResponse.json({ message: "Origin not allowed." }, { status: 403 });
  }

  const rate = checkWriteLimit(request);
  if (!rate.allowed) {
    return applyCorsHeaders(tooManyRequestsResponse(rate.retryAfter), cors.origin);
  }

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return applyCorsHeaders(authResult, cors.origin);
  }

  const forbidden = requireRole(authResult, ["ADMIN"]);
  if (forbidden) {
    return applyCorsHeaders(forbidden, cors.origin);
  }

  const { id } = await context.params;
  const prodectId = parseId(id);
  if (!prodectId) return applyCorsHeaders(prodectNotFoundResponse(), cors.origin);

  try {
    const existing = await prisma.prodects.findUnique({ where: { id: prodectId } });
    if (!existing) return applyCorsHeaders(prodectNotFoundResponse(), cors.origin);

    await prisma.prodects.delete({ where: { id: prodectId } });
    await deleteImageFile(existing.image);

    return applyCorsHeaders(NextResponse.json({ message: "Prodect deleted successfully." }), cors.origin);
  } catch {
    return applyCorsHeaders(unexpectedServerErrorResponse(), cors.origin);
  }
}

export async function OPTIONS(request: NextRequest) {
  const cors = ensureCors(request);
  if (cors.blocked) {
    return NextResponse.json({ message: "Origin not allowed." }, { status: 403 });
  }

  return applyCorsHeaders(new NextResponse(null, { status: 204 }), cors.origin);
}
