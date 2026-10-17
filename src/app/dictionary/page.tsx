import type { Metadata } from "next";
import { DictionaryExplorer } from "@/components/dictionary-explorer";

export const metadata: Metadata = {
  title: "词典",
  description:
    "亚美尼亚语、英语、俄语与中文四语词典。搜索词条、转写与例句，并按主题和亚美尼亚字母浏览。",
};

export default function DictionaryPage() {
  return <DictionaryExplorer />;
}
