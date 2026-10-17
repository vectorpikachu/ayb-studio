import type { Metadata } from "next";
import { ReviewGuest } from "@/components/review-guest";
import { ReviewStudio } from "@/components/review-studio";
import { getCurrentUser } from "@/lib/server/auth";
import { getContentWordById } from "@/lib/server/content";
import { createReviewSession } from "@/lib/server/review";

export const metadata: Metadata = {
  title: "复习",
  description:
    "用带例句的间隔重复卡片复习亚美尼亚语。四档评分、按月增长的下次复习时间，以及连续学习记录。",
};

type ReviewPageProps = {
  searchParams: Promise<{ word?: string | string[] }>;
};

export const dynamic = "force-dynamic";

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const user = await getCurrentUser();
  if (!user) return <ReviewGuest />;

  const params = await searchParams;
  const rawWord = Array.isArray(params.word) ? params.word[0] : params.word;
  const focusWordId = rawWord && (await getContentWordById(rawWord)) ? rawWord : undefined;

  const session = await createReviewSession(user.id, { focusWordId });

  return (
    <ReviewStudio
      initialSession={session}
      userName={user.name}
      initialFocusWordId={focusWordId}
    />
  );
}
