import { NextResponse } from "next/server";
import { authenticateUser, createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/server/auth";
import { DEMO_EMAIL, DEMO_PASSWORD, isDemoEnabled } from "@/lib/server/demo";
import { checkRateLimit, requestIp } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

async function handleDemo(request: Request) {
  if (!isDemoEnabled()) {
    return NextResponse.json({ error: "演示账号未启用。" }, { status: 404 });
  }

  const ip = requestIp(request);
  if (!checkRateLimit(`demo:${ip}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "尝试次数过多，请稍后再试。" }, { status: 429 });
  }

  const user = await authenticateUser(DEMO_EMAIL, DEMO_PASSWORD);
  if (!user) {
    return NextResponse.json({ error: "演示账号暂不可用。" }, { status: 503 });
  }

  const token = await createSession(user.id);
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(request));
  return response;
}

export async function POST(request: Request) {
  try {
    return await handleDemo(request);
  } catch (error) {
    console.error("[auth/demo]", error);
    return NextResponse.json({ error: "服务暂时不可用，请稍后再试。" }, { status: 500 });
  }
}
