import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/server/auth";
import { submitGrammarQuiz } from "@/lib/server/grammar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const submissionSchema = z.object({
  lessonId: z.string().min(1).max(80),
  answers: z.array(z.number().int().min(0).max(20)).min(1).max(20),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录，再保存课程进度。" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求格式有误。" }, { status: 400 });
    }

    const parsed = submissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "答题数据无效。" }, { status: 400 });
    }

    const result = await submitGrammarQuiz(user.id, parsed.data.lessonId, parsed.data.answers);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNKNOWN_LESSON") {
      return NextResponse.json({ error: "找不到这节课程。" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "INVALID_ANSWERS") {
      return NextResponse.json({ error: "答题数量与课程不匹配。" }, { status: 400 });
    }
    console.error("[grammar/complete]", error);
    return NextResponse.json({ error: "暂时无法保存进度，请稍后再试。" }, { status: 500 });
  }
}
