import { NextResponse } from "next/server";
import { createSession, registerUser, SESSION_COOKIE, sessionCookieOptions } from "@/lib/server/auth";
import { checkRateLimit, requestIp } from "@/lib/server/rate-limit";
import { firstIssue, registerSchema } from "@/lib/server/validation";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function handleRegister(request: Request) {
  const ip = requestIp(request);
  if (!checkRateLimit(`register:${ip}`, 10, 60 * 60 * 1000)) {
    return jsonError("注册尝试次数过多，请稍后再试。", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("请求格式有误。", 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstIssue(parsed.error), 400);

  const result = await registerUser(parsed.data);
  if (!result.ok) {
    return jsonError("这个邮箱已经注册过了，请直接登录。", 409);
  }

  const token = await createSession(result.user.id);
  const response = NextResponse.json({ user: result.user }, { status: 201 });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

export async function POST(request: Request) {
  try {
    return await handleRegister(request);
  } catch (error) {
    console.error("[auth/register]", error);
    return jsonError("服务暂时不可用，请稍后再试。", 500);
  }
}
