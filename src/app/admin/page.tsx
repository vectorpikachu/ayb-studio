import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminContentStudio } from "@/components/admin/admin-content-studio";
import { getCurrentUser } from "@/lib/server/auth";
import { getAdminContentSnapshot } from "@/lib/server/admin-content";

export const metadata: Metadata = {
  title: "内容管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{ welcome?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") notFound();

  const { welcome } = await searchParams;
  const snapshot = await getAdminContentSnapshot();
  return (
    <AdminContentStudio
      initial={snapshot}
      adminName={user.name}
      welcome={welcome === "1"}
    />
  );
}
