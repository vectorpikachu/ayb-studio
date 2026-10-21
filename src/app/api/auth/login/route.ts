import { NextResponse } from "next/server";
import {
  authenticateUser,
  createSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/server/auth";
import { DEMO_EMAIL, isDemoEnabled } from "@/lib/server/demo";
import { checkRateLimit, requestIp } from "@/lib/server/rate-limit";
import { firstIssue, loginSchema } from "@/lib/server/validation";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function handleLogin(request: Request) {
  const ip = requestIp(request);
  if (!checkRateLimit(`login:${ip}`, 20, 10 * 60 * 1000)) {
    return jsonError("尝试次数过多，请稍后再试。", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("请求格式有误。", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstIssue(parsed.error), 400);

  if (!isDemoEnabled() && parsed.data.email === DEMO_EMAIL) {
    return jsonError("邮箱或密码不正确。", 401);
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);
  if (!user) return jsonError("邮箱或密码不正确。", 401);

  const token = await createSession(user.id);
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(request));
  return response;
}

export async function POST(request: Request) {
  try {
    return await handleLogin(request);
  } catch (error) {
    console.error("[auth/login]", error);
    return jsonError("服务暂时不可用，请稍后再试。", 500);
  }
}
