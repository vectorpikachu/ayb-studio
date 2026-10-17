import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/server/auth";
import { createWritingForUser, listWritingsForUser } from "@/lib/server/writings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const writingSchema = z.object({
  title: z.string().max(160).optional().default(""),
  titleZh: z.string().max(160).optional().default(""),
  body: z.string().max(60_000).optional().default(""),
  translation: z.string().max(30_000).optional().default(""),
  tags: z.array(z.string().trim().min(1).max(20)).max(8).optional().default([]),
  status: z.enum(["draft", "final"]).optional().default("draft"),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });
    const writings = await listWritingsForUser(user.id);
    return NextResponse.json({ writings }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[writings:list]", error);
    return NextResponse.json({ error: "暂时无法读取文章。" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求格式有误。" }, { status: 400 });
    }

    const parsed = writingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "文章内容格式有误。" }, { status: 400 });
    }

    const writing = await createWritingForUser(user.id, parsed.data);
    return NextResponse.json(
      { writing },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "WRITING_LIMIT") {
      return NextResponse.json({ error: "文章数量已达到上限。" }, { status: 400 });
    }
    console.error("[writings:create]", error);
    return NextResponse.json({ error: "暂时无法创建文章。" }, { status: 500 });
  }
}
