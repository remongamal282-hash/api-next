import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import { deleteImageFile, saveImageFile } from "@/lib/upload";
import { parseUpdateProdectWebFormData } from "@/lib/validation";

export const runtime = "nodejs";

function parseId(rawId: string): number | null {
  const parsed = Number(rawId);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(request);
  if (!session?.simple_auth) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const prodectId = parseId(id);
  if (!prodectId) {
    return NextResponse.json({ message: "Prodect not found." }, { status: 404 });
  }

  const currentProdect = await prisma.prodects.findUnique({ where: { id: prodectId } });
  if (!currentProdect) {
    return NextResponse.json({ message: "Prodect not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const parsed = parseUpdateProdectWebFormData(formData);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  let newImagePath: string | null = null;
  try {
    if (parsed.data.image) {
      await deleteImageFile(currentProdect.image);
      newImagePath = await saveImageFile(parsed.data.image);
    }

    await prisma.prodects.update({
      where: { id: prodectId },
      data: {
        name: parsed.data.name,
        descripshin: parsed.data.descripshin,
        price: parsed.data.price,
        image: newImagePath ?? currentProdect.image
      }
    });

    return NextResponse.json({ message: "Prodect updated successfully." });
  } catch {
    await deleteImageFile(newImagePath);
    return NextResponse.json({ message: "Unexpected server error." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(request);
  if (!session?.simple_auth) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const prodectId = parseId(id);
  if (!prodectId) {
    return NextResponse.json({ message: "Prodect not found." }, { status: 404 });
  }

  const currentProdect = await prisma.prodects.findUnique({ where: { id: prodectId } });
  if (!currentProdect) {
    return NextResponse.json({ message: "Prodect not found." }, { status: 404 });
  }

  try {
    await prisma.prodects.delete({ where: { id: prodectId } });
    await deleteImageFile(currentProdect.image);
    return NextResponse.json({ message: "Prodect deleted successfully." });
  } catch {
    return NextResponse.json({ message: "Unexpected server error." }, { status: 500 });
  }
}
