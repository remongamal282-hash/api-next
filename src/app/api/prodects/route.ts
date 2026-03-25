import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prodectNotFoundResponse, tooManyRequestsResponse, unexpectedServerErrorResponse, validationFailedResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { checkRateLimit } from "@/middlewares/rate-limit";
import { deleteImageFile, saveImageFile } from "@/lib/upload";
import { parseStoreProdectFormData } from "@/lib/validation";
import { applyCorsHeaders, ensureCors } from "@/utils/cors";

export const runtime = "nodejs";

function checkReadLimit(request: NextRequest) {
  return checkRateLimit(request, "api-read", 60, 60_000);
}

function checkWriteLimit(request: NextRequest) {
  return checkRateLimit(request, "api-write", 5, 60_000);
}

export async function GET(request: NextRequest) {
  const cors = ensureCors(request);
  if (cors.blocked) {
    return NextResponse.json({ message: "Origin not allowed." }, { status: 403 });
  }

  const rate = checkReadLimit(request);
  if (!rate.allowed) {
    return applyCorsHeaders(tooManyRequestsResponse(rate.retryAfter), cors.origin);
  }

  try {
    const searchTerm = request.nextUrl.searchParams.get("search") ?? request.nextUrl.searchParams.get("name");
    const normalizedSearch = searchTerm?.trim() || "";

    const prodects = await prisma.prodects.findMany({
      where: normalizedSearch
        ? {
            name: {
              contains: normalizedSearch
            }
          }
        : undefined,
      orderBy: {
        created_at: "desc"
      }
    });

    if (normalizedSearch && prodects.length === 0) {
      return applyCorsHeaders(prodectNotFoundResponse(), cors.origin);
    }

    return applyCorsHeaders(NextResponse.json(prodects), cors.origin);
  } catch {
    return applyCorsHeaders(unexpectedServerErrorResponse(), cors.origin);
  }
}

export async function POST(request: NextRequest) {
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

  const formData = await request.formData();
  const parsed = parseStoreProdectFormData(formData);

  if (!parsed.success) {
    return applyCorsHeaders(validationFailedResponse(parsed.error.flatten().fieldErrors), cors.origin);
  }

  let uploadedImagePath: string | null = null;
  try {
    uploadedImagePath = await saveImageFile(parsed.data.image);
    const created = await prisma.prodects.create({
      data: {
        name: parsed.data.name,
        descripshin: parsed.data.descripshin,
        price: parsed.data.price,
        image: uploadedImagePath
      }
    });

    return applyCorsHeaders(NextResponse.json(created, { status: 201 }), cors.origin);
  } catch {
    await deleteImageFile(uploadedImagePath);
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
