import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  deleteSessionByToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      await deleteSessionByToken(token);
    } catch {
      // Clearing the cookie below is still the right outcome if storage fails.
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(request),
    maxAge: 0,
  });
  return response;
}
