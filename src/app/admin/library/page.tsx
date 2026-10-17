import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LibraryStudio } from "@/components/admin/library-studio";
import { getCurrentUser } from "@/lib/server/auth";
import { getAdminContentSnapshot } from "@/lib/server/admin-content";

export const metadata: Metadata = {
  title: "课文与文化管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/library");
  if (user.role !== "admin") notFound();

  const snapshot = await getAdminContentSnapshot();
  return <LibraryStudio initial={snapshot} adminName={user.name} />;
}
