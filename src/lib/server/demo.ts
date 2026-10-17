export const DEMO_NAME = "Lilit";
export const DEMO_EMAIL = "demo@ayb.app";
export const DEMO_PASSWORD = "barev1234";

export function isDemoEnabled() {
  const flag = process.env.AYB_ENABLE_DEMO;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}
