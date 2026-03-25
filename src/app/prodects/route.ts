import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import { deleteImageFile, saveImageFile } from "@/lib/upload";
import { parseStoreProdectFormData } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.simple_auth) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const parsed = parseStoreProdectFormData(formData);
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/prodects/create?error=Validation failed.", request.url), 303);
  }

  let uploadedImagePath: string | null = null;
  try {
    uploadedImagePath = await saveImageFile(parsed.data.image);

    await prisma.prodects.create({
      data: {
        name: parsed.data.name,
        descripshin: parsed.data.descripshin,
        price: parsed.data.price,
        image: uploadedImagePath
      }
    });

    return NextResponse.redirect(
      new URL("/ProdectWebController?success=Prodect created successfully.", request.url),
      303
    );
  } catch {
    await deleteImageFile(uploadedImagePath);
    return NextResponse.redirect(new URL("/prodects/create?error=Unexpected server error.", request.url), 303);
  }
}
