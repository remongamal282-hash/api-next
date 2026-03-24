import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const uploadRoot = path.join(process.cwd(), "public", "uploads", "prodects");
const allowedMimes = new Map<string, string>([
  ["image/jpg", "jpg"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

export async function saveImageFile(imageFile: File): Promise<string> {
  await mkdir(uploadRoot, { recursive: true });

  const extFromMime = allowedMimes.get(imageFile.type);
  const originalExt = path.extname(imageFile.name).replace(".", "").toLowerCase();
  const extension = extFromMime ?? originalExt;
  const safeExtension = extension || "jpg";

  const filename = `${Date.now()}-${randomUUID()}.${safeExtension}`;
  const absolutePath = path.join(uploadRoot, filename);
  const relativePath = `prodects/${filename}`;

  const bytes = await imageFile.arrayBuffer();
  await writeFile(absolutePath, Buffer.from(bytes));

  return relativePath;
}

export async function deleteImageFile(relativePath: string | null | undefined): Promise<void> {
  if (!relativePath) return;

  const normalized = path.posix.normalize(relativePath);
  if (!normalized.startsWith("prodects/")) return;

  const absolutePath = path.join(process.cwd(), "public", "uploads", ...normalized.split("/"));
  try {
    await unlink(absolutePath);
  } catch {
    // ignore missing files
  }
}
