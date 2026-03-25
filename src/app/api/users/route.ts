import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleListUsers } from "@/controllers/user-controller";
import { applyCorsHeaders, ensureCors } from "@/utils/cors";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return handleListUsers(request);
}

export async function OPTIONS(request: NextRequest) {
  const cors = ensureCors(request);
  if (cors.blocked) {
    return NextResponse.json({ message: "Origin not allowed." }, { status: 403 });
  }

  return applyCorsHeaders(new NextResponse(null, { status: 204 }), cors.origin);
}
