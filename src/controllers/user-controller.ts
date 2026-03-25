import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { listUsers } from "@/services/user-service";
import { applyCorsHeaders, ensureCors } from "@/utils/cors";

export async function handleListUsers(request: NextRequest) {
  const cors = ensureCors(request);
  if (cors.blocked) {
    return NextResponse.json({ message: "Origin not allowed." }, { status: 403 });
  }

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return applyCorsHeaders(authResult, cors.origin);
  }

  const forbidden = requireRole(authResult, ["ADMIN"]);
  if (forbidden) {
    return applyCorsHeaders(forbidden, cors.origin);
  }

  const users = await listUsers();
  return applyCorsHeaders(NextResponse.json({ users }), cors.origin);
}

