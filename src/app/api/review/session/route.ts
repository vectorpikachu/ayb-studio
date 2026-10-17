import { NextResponse, type NextRequest } from "next/server";
import { getWordById } from "@/data/dictionary";
import { getCurrentUser } from "@/lib/server/auth";
import { createReviewSession } from "@/lib/server/review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录，再开始复习。" }, { status: 401 });
    }

    const focusCandidate = request.nextUrl.searchParams.get("word") ?? undefined;
    const focusWordId =
      focusCandidate && getWordById(focusCandidate) ? focusCandidate : undefined;

    const session = await createReviewSession(user.id, { focusWordId });
    return NextResponse.json(session, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[review/session]", error);
    return NextResponse.json({ error: "暂时无法开始复习，请稍后再试。" }, { status: 500 });
  }
}
