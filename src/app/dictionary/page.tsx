import type { Metadata } from "next";
import { DictionaryExplorer } from "@/components/dictionary-explorer";
import { getContentWords } from "@/lib/server/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "词典",
  description:
    "亚美尼亚语、英语、俄语与中文四语词典。每个词条都有中、英、俄释义、学习者转写与原创例句，可按主题和字母浏览。",
};

export default async function DictionaryPage() {
  const words = await getContentWords();
  return <DictionaryExplorer words={words} />;
}
