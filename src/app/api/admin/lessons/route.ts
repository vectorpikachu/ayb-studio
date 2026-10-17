import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import {
  formatValidationErrors,
  lessonsUploadSchema,
} from "@/lib/server/admin-validation";
import { saveCustomLessons } from "@/lib/server/admin-content";
import type { GrammarLesson } from "@/data/grammar/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });
    if (user.role !== "admin") {
      return NextResponse.json({ error: "需要管理员权限。" }, { status: 403 });
    }

    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > 2_000_000) {
      return NextResponse.json({ error: "上传文件不能超过 2MB。" }, { status: 413 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON 文件格式有误。" }, { status: 400 });
    }

    const parsed = lessonsUploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatValidationErrors(parsed.error) },
        { status: 400 },
      );
    }

    const data = await saveCustomLessons(parsed.data as GrammarLesson[]);
    revalidatePath("/", "layout");
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "LESSON_LIMIT") {
      return NextResponse.json({ error: "自定义语法课数量已达到上限。" }, { status: 400 });
    }
    console.error("[admin/lessons:create]", error);
    return NextResponse.json({ error: "保存课程失败，请稍后再试。" }, { status: 500 });
  }
}
