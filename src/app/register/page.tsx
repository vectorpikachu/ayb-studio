import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "注册",
  description: "创建 Ayb 账户，保存亚美尼亚语学习进度与文章。",
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <AuthPageShell mode="register">
      <RegisterForm />
    </AuthPageShell>
  );
}
