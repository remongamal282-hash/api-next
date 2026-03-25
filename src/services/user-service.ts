import { prisma } from "@/lib/prisma";

export async function listUsers() {
  return prisma.users.findMany({
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
      updated_at: true
    }
  });
}

