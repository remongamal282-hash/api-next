import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function unauthorizedApiKeyResponse() {
  return NextResponse.json({ message: "Unauthorized: invalid admin API key." }, { status: 401 });
}

export function validationFailedResponse(errors: Record<string, string[] | undefined>) {
  return NextResponse.json(
    {
      message: "Validation failed.",
      errors
    },
    { status: 422 }
  );
}

export function prodectNotFoundResponse() {
  return NextResponse.json({ message: "Prodect not found." }, { status: 404 });
}

export function unexpectedServerErrorResponse() {
  return NextResponse.json({ message: "Unexpected server error." }, { status: 500 });
}

export function tooManyRequestsResponse(retryAfter: number) {
  return NextResponse.json(
    { message: "Too many requests." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) }
    }
  );
}

export function zodErrorToValidationResponse(error: ZodError) {
  return validationFailedResponse(error.flatten().fieldErrors);
}
