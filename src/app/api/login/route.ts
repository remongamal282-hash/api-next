import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";

const invalidCredentialsMessage = "Invalid username or password.";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(invalidCredentialsMessage)}`, request.url),
      303
    );
  }

  const user = await prisma.users.findFirst({
    where: {
      OR: [{ name: username }, { email: username }]
    }
  });

  if (!user) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(invalidCredentialsMessage)}`, request.url),
      303
    );
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(invalidCredentialsMessage)}`, request.url),
      303
    );
  }

  const response = NextResponse.redirect(new URL("/ProdectWebController", request.url), 303);
  await setSessionCookie(response, {
    sid: randomUUID(),
    simple_auth: true,
    simple_auth_user: user.name,
    simple_auth_user_id: user.id
  });

  return response;
}
