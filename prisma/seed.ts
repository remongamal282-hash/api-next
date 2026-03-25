import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

const adjectives = [
  "Modern",
  "Classic",
  "Premium",
  "Ultra",
  "Compact",
  "Smart",
  "Eco",
  "Pro",
  "Lite",
  "Max",
  "Plus",
  "Advanced",
  "Sleek",
  "Durable",
  "Portable",
  "Elegant",
  "Bold",
  "Fresh",
  "Pure",
  "Prime"
];

const nouns = [
  "Lamp",
  "Chair",
  "Table",
  "Bottle",
  "Speaker",
  "Backpack",
  "Watch",
  "Headset",
  "Mouse",
  "Keyboard",
  "Stand",
  "Cable",
  "Mixer",
  "Kettle",
  "Toaster",
  "Notebook",
  "Pillow",
  "Blanket",
  "Fan",
  "Mirror",
  "Shelf",
  "Wallet",
  "Mug",
  "Clock",
  "Router",
  "Camera",
  "Tripod",
  "Bottle",
  "Tumbler",
  "Organizer"
];

function generateSeedProdects(total: number) {
  const items: Array<{ name: string; descripshin: string; price: string }> = [];
  for (let i = 1; i <= total; i += 1) {
    const adjective = adjectives[i % adjectives.length];
    const noun = nouns[i % nouns.length];
    const name = `Prodect ${i.toString().padStart(3, "0")} ${adjective} ${noun}`;
    const basePrice = 15 + (i * 3) % 240;
    const cents = (i * 7) % 100;
    const price = `${basePrice}.${cents.toString().padStart(2, "0")}`;
    const descripshin = `High-quality ${adjective.toLowerCase()} ${noun.toLowerCase()} with dependable build and everyday use.`;

    items.push({ name, descripshin, price });
  }

  return items;
}

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
      password: hashedPassword,
      role: "ADMIN"
    },
    create: {
      email: "remon@example.com",
      name: "remon gamal",
      password: hashedPassword,
      role: "ADMIN"
    }
  });
}

async function seedProdects() {
  const entries = generateSeedProdects(200);
  const existing = await prisma.prodects.findMany({
    where: { name: { in: entries.map((entry) => entry.name) } },
    select: { name: true }
  });

  const existingNames = new Set(existing.map((item) => item.name));
  const toCreate = entries.filter((entry) => !existingNames.has(entry.name));

  for (const entry of toCreate) {
    await prisma.prodects.create({ data: entry });
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
