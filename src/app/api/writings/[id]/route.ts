import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/server/auth";
import { deleteWritingForUser, updateWritingForUser } from "@/lib/server/writings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z
  .object({
    title: z.string().max(160).optional(),
    titleZh: z.string().max(160).optional(),
    body: z.string().max(60_000).optional(),
    translation: z.string().max(30_000).optional(),
    tags: z.array(z.string().trim().min(1).max(20)).max(8).optional(),
    status: z.enum(["draft", "final"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "没有需要保存的内容。",
  });

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "登录状态已失效，请重新登录。" }, { status: 401 });

    const { id } = await context.params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求格式有误。" }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "文章内容格式有误。" }, { status: 400 });
    }

    const writing = await updateWritingForUser(user.id, id, parsed.data);
    if (!writing) return NextResponse.json({ error: "找不到这篇文章。" }, { status: 404 });

    return NextResponse.json({ writing }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "EMPTY_BODY") {
      return NextResponse.json({ error: "内容为空时不能标记为完成。" }, { status: 400 });
    }
    console.error("[writings:update]", error);
    return NextResponse.json({ error: "暂时无法保存文章。" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "登录状态已失效，请重新登录。" }, { status: 401 });

    const { id } = await context.params;
    const deleted = await deleteWritingForUser(user.id, id);
    if (!deleted) return NextResponse.json({ error: "找不到这篇文章。" }, { status: 404 });

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[writings:delete]", error);
    return NextResponse.json({ error: "暂时无法删除文章。" }, { status: 500 });
  }
}
