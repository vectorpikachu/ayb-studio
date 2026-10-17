import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appUrl = process.env.AYB_DESKTOP_URL ?? "http://127.0.0.1:3000";
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const electronCli = path.join(root, "node_modules", "electron", "cli.js");

if (!existsSync(nextBin)) {
  throw new Error("找不到 Next.js。请先运行 npm install。");
}
if (!existsSync(electronCli)) {
  throw new Error("找不到 Electron。请先运行 npm install。");
}

const children = new Set();

function run(command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  children.add(child);
  child.on("exit", () => children.delete(child));
  return child;
}

function stop(child) {
  if (!child || child.exitCode !== null || !child.pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }
  try {
    child.kill("SIGTERM");
  } catch {
    // The process may already be gone.
  }
}

async function healthy() {
  try {
    const response = await fetch(`${appUrl}/api/health`, { cache: "no-store" });
    if (!response.ok) return false;
    const data = await response.json().catch(() => null);
    return Boolean(data && data.ok && data.service === "ayb");
  } catch {
    return false;
  }
}

let next = null;

if (!(await healthy())) {
  console.log("[desktop:dev] 启动 Next.js 开发服务器…");
  next = run(process.execPath, [nextBin, "dev", "-p", "3000"], {
    NEXT_TELEMETRY_DISABLED: "1",
  });

  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (await healthy()) break;
    if (next.exitCode !== null) {
      throw new Error("Next.js 开发服务器提前退出。");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (!(await healthy())) {
    stop(next);
    throw new Error("Next.js 开发服务器在 90 秒内没有就绪。");
  }
} else {
  console.log("[desktop:dev] 复用已运行的开发服务器。");
}

console.log("[desktop:dev] 启动 Electron…");
const electron = run(process.execPath, [electronCli, "."], {
  AYB_DESKTOP_URL: appUrl,
});

electron.on("exit", (code) => {
  stop(next);
  process.exit(code ?? 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stop(electron);
    stop(next);
    process.exit(0);
  });
}
