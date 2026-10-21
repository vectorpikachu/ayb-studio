import type { Metadata } from "next";
import { DictionaryExplorer } from "@/components/dictionary-explorer";
import { getContentWords } from "@/lib/server/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "词典",
  description:
    "亚美尼亚语、英语、俄语与中文四语词典，收录 13,919 条词条，包含按语料频率挑选的扩展常用词。搜索词条、转写与例句，并按主题和字母浏览。",
};

export default async function DictionaryPage() {
  const words = await getContentWords();
  return <DictionaryExplorer words={words} />;
}
