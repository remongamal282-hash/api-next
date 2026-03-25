import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/services/token-service";

export type AuthContext = {
  userId: string;
  role: "ADMIN" | "USER" | "VIEWER";
};

export async function requireAuth(request: NextRequest): Promise<AuthContext | NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  return {
    userId: payload.sub,
    role: payload.role
  };
}

