"use strict";

const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const isDev = !app.isPackaged;
const devServerUrl = process.env.AYB_DESKTOP_URL ?? "http://127.0.0.1:3000";

let mainWindow = null;
let serverProcess = null;
let serverExitCode = null;
let serverUrl = devServerUrl;
let serverOutput = "";
let quitting = false;

function log(...args) {
  console.log("[desktop]", ...args);
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close((error) => {
        if (error) reject(error);
        else if (port) resolve(port);
        else reject(new Error("无法为本地服务分配端口。"));
      });
    });
  });
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function probe(url, timeoutMs = 1_500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${url}/api/health`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const data = await response.json().catch(() => null);
    return Boolean(data && data.ok && data.service === "ayb");
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (serverExitCode !== null) {
      throw new Error(
        `本地服务已退出（退出码 ${serverExitCode}）。\n\n${serverOutput.trim() || "没有更多日志。"}`,
      );
    }
    if (await probe(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  throw new Error(
    `本地服务在 ${Math.round(timeoutMs / 1_000)} 秒内没有就绪。\n\n${serverOutput.trim() || "没有更多日志。"}`,
  );
}

async function startProductionServer() {
  const serverRoot = path.join(process.resourcesPath, "server");
  const entry = path.join(serverRoot, "server.js");
  if (!fs.existsSync(entry)) {
    throw new Error(`找不到桌面端服务文件：${entry}`);
  }

  const port = await findFreePort();
  const url = `http://127.0.0.1:${port}`;
  const dataDirectory = ensureDirectory(path.join(app.getPath("userData"), "data"));

  serverOutput = "";
  serverExitCode = null;
  serverProcess = spawn(process.execPath, [entry], {
    cwd: serverRoot,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      AYB_DATA_DIR: dataDirectory,
      AYB_ENABLE_DEMO: process.env.AYB_ENABLE_DEMO ?? "false",
      NEXT_PUBLIC_SITE_URL: url,
    },
  });

  const capture = (chunk) => {
    const text = chunk.toString();
    serverOutput = `${serverOutput}${text}`.slice(-8_000);
    if (isDev) process.stdout.write(text);
  };

  serverProcess.stdout.on("data", capture);
  serverProcess.stderr.on("data", capture);
  serverProcess.on("error", (error) => {
    serverOutput = `${serverOutput}\n${error.message}`;
  });
  serverProcess.on("exit", (code) => {
    serverExitCode = code ?? 1;
    if (!quitting) log(`local server exited with code ${serverExitCode}`);
    serverProcess = null;
  });

  log(`starting local server on ${url}`);
  await waitForServer(url, 45_000);
  return url;
}

function stopServer() {
  const child = serverProcess;
  serverProcess = null;
  if (!child || !child.pid) return;
  serverExitCode = 0;

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

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function showLoadError(error) {
  const message = escapeHtml(error instanceof Error ? error.message : String(error));
  const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ayb</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 40px;
        background: #f4f0e7;
        color: #201d18;
        font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
      }
      main { max-width: 640px; }
      p { margin: 0 0 12px; color: #716a60; font-size: 14px; line-height: 1.7; }
      h1 { margin: 0 0 20px; font-size: 32px; letter-spacing: -0.04em; }
      pre {
        margin: 20px 0;
        padding: 16px;
        overflow: auto;
        border: 1px solid rgba(32, 29, 24, 0.11);
        border-radius: 12px;
        background: #fbf8f1;
        color: #201d18;
        font-size: 12px;
        line-height: 1.7;
        white-space: pre-wrap;
      }
      .tag { color: #bd4435; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; }
    </style>
  </head>
  <body>
    <main>
      <p class="tag">Ayb Desktop</p>
      <h1>本地学习室没有启动。</h1>
      <p>桌面外壳已经打开，但内置的 Next.js 服务没有准备好。请关闭窗口后重试。</p>
      <pre>${message}</pre>
      <p>如果问题持续出现，可以删除应用数据目录后重新启动；这不会影响源码里的内容。</p>
    </main>
  </body>
</html>`;

  if (mainWindow) {
    void mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  }
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    show: false,
    title: "Ayb",
    backgroundColor: "#f4f0e7",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged,
      spellcheck: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (isHttpUrl(target)) void shell.openExternal(target);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, target) => {
    try {
      if (new URL(target).origin !== new URL(url).origin) {
        event.preventDefault();
        if (isHttpUrl(target)) void shell.openExternal(target);
      }
    } catch {
      event.preventDefault();
    }
  });

  mainWindow.webContents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });

  mainWindow.loadURL(url).catch((error) => {
    log("failed to load", error);
    showLoadError(error);
  });

  return mainWindow;
}

function createMenu() {
  if (process.platform !== "darwin") {
    Menu.setApplicationMenu(null);
    return;
  }

  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: app.name,
        submenu: [
          { role: "about" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      {
        label: "编辑",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectAll" },
        ],
      },
      {
        label: "视图",
        submenu: [
          { role: "reload" },
          { role: "toggleDevTools" },
          { type: "separator" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" },
        ],
      },
    ]),
  );
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    app.setAppUserModelId("app.ayb.studio");
    createMenu();

    try {
      if (isDev) {
        const ready = await probe(devServerUrl, 2_500);
        if (!ready) {
          throw new Error(
            `开发服务器没有运行。\n\n请先运行 npm run dev，或使用 npm run desktop:dev。\n期望地址：${devServerUrl}`,
          );
        }
        serverUrl = devServerUrl;
      } else {
        serverUrl = await startProductionServer();
      }
      createWindow(serverUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log("startup failed", message);
      dialog.showErrorBox("Ayb 无法启动", message);
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 && serverUrl) {
      createWindow(serverUrl);
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", () => {
    quitting = true;
    stopServer();
  });
}
