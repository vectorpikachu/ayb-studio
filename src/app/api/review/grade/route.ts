import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/server/auth";
import { gradeReviewWord } from "@/lib/server/review";
import type { ReviewGrade } from "@/lib/srs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const gradeSchema = z.object({
  wordId: z.string().min(1).max(80),
  grade: z.number().int().min(0).max(3),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "登录状态已失效，请重新登录。" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求格式有误。" }, { status: 400 });
    }

    const parsed = gradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "评分数据无效。" }, { status: 400 });
    }

    const nextState = await gradeReviewWord(
      user.id,
      parsed.data.wordId,
      parsed.data.grade as ReviewGrade,
    );

    return NextResponse.json({ state: nextState }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNKNOWN_WORD") {
      return NextResponse.json({ error: "找不到这个单词。" }, { status: 404 });
    }
    console.error("[review/grade]", error);
    return NextResponse.json({ error: "暂时无法保存复习进度，请稍后再试。" }, { status: 500 });
  }
}
