import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";

const baseURL = process.env.AYB_BASE_URL ?? "http://localhost:3000";
const browserCandidates = [
  process.env.AYB_BROWSER_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/microsoft-edge",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const executablePath = browserCandidates.find((candidate) => existsSync(candidate));
if (!executablePath) {
  throw new Error(
    "未找到可用的 Chromium 浏览器。请安装 Edge/Chrome，或设置 AYB_BROWSER_PATH。",
  );
}

const browser = await chromium.launch({ executablePath, headless: true });
const errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));

async function waitForText(text, timeout = 10_000) {
  await page.locator(`text=${text}`).first().waitFor({ state: "visible", timeout });
}

try {
  // Landing page and dictionary search.
  await page.goto(baseURL, { waitUntil: "networkidle" });
  assert.match(await page.title(), /Ayb/);
  await page.goto(`${baseURL}/dictionary`, { waitUntil: "networkidle" });
  const search = page.locator('input[aria-label="搜索词典"]');
  await search.fill("вода");
  await page.waitForTimeout(500);
  assert.equal(await page.locator("button[aria-label^='查看词条']").count(), 1);

  // Demo login.
  await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /一键进入演示空间/ }).click();
  await page.waitForURL(`${baseURL}/`, { timeout: 30_000 });
  await page.waitForTimeout(700);
  assert.ok(await page.locator('button[aria-label$="账户菜单"]').count());

  // Review card and required example sentence.
  await page.goto(`${baseURL}/review`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const flip = page.getByRole("button", { name: /翻开卡片/ });
  if (await flip.count()) {
    await flip.first().click();
    await page.waitForTimeout(400);
    const articleText = await page.locator("article").innerText();
    assert.ok(articleText.includes("例句") || articleText.includes("IN A SENTENCE"));
    const grade = page.getByRole("button", { name: /记得/ });
    await grade.click();
    await page.waitForTimeout(600);
  }

  // Grammar content and quiz presence.
  await page.goto(`${baseURL}/grammar`, { waitUntil: "networkidle" });
  await waitForText("九节课");
  await page.goto(`${baseURL}/grammar/to-be`, { waitUntil: "networkidle" });
  assert.ok((await page.locator("h1").innerText()).includes("是"));
  await waitForText("三题小测");

  // Writing: create a draft, autosave it, then remove it again.
  await page.goto(`${baseURL}/write`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "新建文章" }).first().click();
  await page.waitForTimeout(600);
  const writingTitle = `自动化测试 ${Date.now().toString(36)}`;
  await page.fill('input[aria-label="文章标题"]', writingTitle);
  await page.fill(
    'textarea[aria-label="亚美尼亚语正文"]',
    "Սա փորձնական նախադասություն է։",
  );
  await page.waitForResponse(
    (response) =>
      response.url().includes("/api/writings/") &&
      response.request().method() === "PATCH" &&
      response.status() === 200,
    { timeout: 20_000 },
  );
  await page.waitForFunction(() => document.body.innerText.includes("已保存"), null, {
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "删除文章" }).click();
  await page.getByRole("button", { name: "永久删除" }).click();
  await page.waitForTimeout(700);

  assert.deepEqual(errors, []);
  console.log("E2E OK — dictionary, login, review, grammar, and writing are working.");
} finally {
  await browser.close();
}
