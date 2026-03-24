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
import { deleteImageFile, saveImageFile } from "@/lib/upload";
import { parseStoreProdectFormData } from "@/lib/validation";

export const runtime = "nodejs";

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

export async function GET(request: NextRequest) {
  const rate = checkReadLimit(request);
  if (!rate.allowed) {
    return tooManyRequestsResponse(rate.retryAfter);
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
      return prodectNotFoundResponse();
    }

    return NextResponse.json(prodects);
  } catch {
    return unexpectedServerErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  const rate = checkWriteLimit(request);
  if (!rate.allowed) {
    return tooManyRequestsResponse(rate.retryAfter);
  }

  if (!hasValidApiKey(request)) {
    return unauthorizedApiKeyResponse();
  }

  const formData = await request.formData();
  const parsed = parseStoreProdectFormData(formData);

  if (!parsed.success) {
    return validationFailedResponse(parsed.error.flatten().fieldErrors);
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

    return NextResponse.json(created, { status: 201 });
  } catch {
    await deleteImageFile(uploadedImagePath);
    return unexpectedServerErrorResponse();
  }
}
