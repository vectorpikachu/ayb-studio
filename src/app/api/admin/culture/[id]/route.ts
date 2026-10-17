import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { deleteCustomCultureEntry } from "@/lib/server/admin-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });
    if (user.role !== "admin") {
      return NextResponse.json({ error: "需要管理员权限。" }, { status: 403 });
    }

    const { id } = await context.params;
    const data = await deleteCustomCultureEntry(id);
    revalidatePath("/", "layout");
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "CULTURE_NOT_FOUND") {
      return NextResponse.json({ error: "找不到这条自定义文化条目。" }, { status: 404 });
    }
    console.error("[admin/culture:delete]", error);
    return NextResponse.json({ error: "删除文化条目失败，请稍后再试。" }, { status: 500 });
  }
}
