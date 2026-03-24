import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

const prodectSeedData = [
  {
    name: "Prodect One",
    descripshin: "Sample descripshin for prodect one.",
    price: "99.99"
  },
  {
    name: "Prodect Two",
    descripshin: "Sample descripshin for prodect two.",
    price: "149.50"
  },
  {
    name: "Prodect Three",
    descripshin: "Sample descripshin for prodect three.",
    price: "299.00"
  }
];

function buildPlaceholderSvg(prodectName: string): string {
  const safeTitle = prodectName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f4f4f5"/>
      <stop offset="100%" stop-color="#e4e4e7"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" fill="#27272a" font-size="56" font-family="Arial, sans-serif">No Image</text>
  <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" fill="#52525b" font-size="36" font-family="Arial, sans-serif">${safeTitle}</text>
</svg>`;
}

async function ensureAdminUser() {
  const hashedPassword = await bcrypt.hash("112233", 10);
  await prisma.users.upsert({
    where: { email: "remon@example.com" },
    update: {
      name: "remon gamal",
      password: hashedPassword
    },
    create: {
      email: "remon@example.com",
      name: "remon gamal",
      password: hashedPassword
    }
  });
}

async function seedProdects() {
  for (const entry of prodectSeedData) {
    const existing = await prisma.prodects.findFirst({
      where: { name: entry.name }
    });

    if (!existing) {
      await prisma.prodects.create({ data: entry });
    }
  }
}

async function backfillMissingImages() {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "prodects");
  await mkdir(uploadDir, { recursive: true });

  const missingImages = await prisma.prodects.findMany({
    where: {
      OR: [{ image: null }, { image: "" }]
    }
  });

  for (const prodect of missingImages) {
    const fileName = `placeholder-${prodect.id}.svg`;
    const absolutePath = path.join(uploadDir, fileName);
    const relativePath = `prodects/${fileName}`;

    await writeFile(absolutePath, buildPlaceholderSvg(prodect.name), "utf8");
    await prisma.prodects.update({
      where: { id: prodect.id },
      data: { image: relativePath }
    });
  }
}

async function main() {
  await ensureAdminUser();
  await seedProdects();
  await backfillMissingImages();
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
    await prisma.$disconnect();
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
