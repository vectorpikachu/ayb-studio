import type { Metadata } from "next";
import { WriteGuest } from "@/components/writing/write-guest";
import { WritingStudio } from "@/components/writing/writing-studio";
import { getCurrentUser } from "@/lib/server/auth";
import { listWritingsForUser } from "@/lib/server/writings";

export const metadata: Metadata = {
  title: "写作室",
  description:
    "用亚美尼亚语写下自己的文章：自动保存、中文对照、标签、预览与导出，只属于你的私人写作空间。",
};

export const dynamic = "force-dynamic";

export default async function WritePage() {
  const user = await getCurrentUser();
  if (!user) return <WriteGuest />;

  const writings = await listWritingsForUser(user.id);

  return <WritingStudio initialWritings={writings} userName={user.name} />;
}
