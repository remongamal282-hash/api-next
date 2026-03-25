import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sha256, safeEqual } from "@/utils/hash";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/services/token-service";
import { log } from "@/utils/logger";

export async function registerUser(data: { name: string; email: string; password: string }) {
  const existing = await prisma.users.findUnique({ where: { email: data.email } });
  if (existing) {
    return { ok: false, message: "Email already exists." } as const;
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const created = await prisma.users.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: "USER"
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true
    }
  });

  return { ok: true, user: created } as const;
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;
  return user;
}

export async function issueTokensForUser(userId: string, role: "ADMIN" | "USER" | "VIEWER") {
  const access = await signAccessToken(userId, role);
  const refresh = await signRefreshToken(userId);
  const refreshHash = sha256(refresh.token);

  await prisma.users.update({
    where: { id: userId },
    data: {
      refresh_token_hash: refreshHash,
      refresh_token_expires_at: refresh.expiresAt
    }
  });

  return { access, refresh };
}

export async function rotateRefreshToken(refreshToken: string) {
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    return { ok: false, message: "Invalid refresh token." } as const;
  }

  const user = await prisma.users.findUnique({ where: { id: payload.sub } });
  if (!user || !user.refresh_token_hash || !user.refresh_token_expires_at) {
    return { ok: false, message: "Invalid refresh token." } as const;
  }

  if (user.refresh_token_expires_at.getTime() < Date.now()) {
    return { ok: false, message: "Refresh token expired." } as const;
  }

  const providedHash = sha256(refreshToken);
  if (!safeEqual(providedHash, user.refresh_token_hash)) {
    log("warn", "Refresh token mismatch", { userId: user.id });
    return { ok: false, message: "Invalid refresh token." } as const;
  }

  const access = await signAccessToken(user.id, user.role);
  const refresh = await signRefreshToken(user.id);
  const refreshHash = sha256(refresh.token);

  await prisma.users.update({
    where: { id: user.id },
    data: {
      refresh_token_hash: refreshHash,
      refresh_token_expires_at: refresh.expiresAt
    }
  });

  return { ok: true, access, refresh, user } as const;
}

export async function revokeRefreshToken(userId: string) {
  await prisma.users.update({
    where: { id: userId },
    data: {
      refresh_token_hash: null,
      refresh_token_expires_at: null
    }
  });
}

