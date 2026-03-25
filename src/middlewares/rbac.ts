import { NextResponse } from "next/server";
import type { AuthContext } from "@/middlewares/auth";

export function requireRole(context: AuthContext, roles: Array<AuthContext["role"]>) {
  if (!roles.includes(context.role)) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  return null;
}

