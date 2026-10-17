import { access, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const standalone = path.join(root, ".next", "standalone");

try {
  await access(path.join(standalone, "server.js"));
} catch {
  throw new Error("找不到 .next/standalone/server.js，请先运行 npm run build。");
}

for (const entry of [".data", ".env", ".env.local", ".ref", "qa-output"]) {
  await rm(path.join(standalone, entry), { recursive: true, force: true });
}

console.log("Prepared .next/standalone for desktop packaging (local data excluded).");
