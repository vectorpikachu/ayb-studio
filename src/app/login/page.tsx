import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/server/auth";
import { DEMO_EMAIL, DEMO_PASSWORD, isDemoEnabled } from "@/lib/server/demo";

export const metadata: Metadata = {
  title: "登录",
  description: "登录 Ayb，继续你的亚美尼亚语学习。",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const demoEnabled = isDemoEnabled();

  return (
    <AuthPageShell mode="login">
      <LoginForm
        demoEnabled={demoEnabled}
        demoEmail={demoEnabled ? DEMO_EMAIL : undefined}
        demoPassword={demoEnabled ? DEMO_PASSWORD : undefined}
      />
    </AuthPageShell>
  );
}
