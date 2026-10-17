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
  // Landing page and light default theme.
  await page.goto(baseURL, { waitUntil: "networkidle" });
  assert.match(await page.title(), /Ayb/);
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");

  // Dictionary search, including a long Armenian word that must fit its card.
  await page.goto(`${baseURL}/dictionary`, { waitUntil: "networkidle" });
  const search = page.locator('input[aria-label="搜索词典"]');
  await search.fill("вода");
  await page.waitForTimeout(500);
  assert.equal(await page.locator("button[aria-label^='查看词条']").count(), 1);

  await search.fill("շնորհակալություն");
  await page.waitForTimeout(500);
  const longWordCard = page.locator("button[aria-label^='查看词条']").first();
  assert.ok(await longWordCard.count(), "long Armenian word should be found");
  const fits = await longWordCard.evaluate(
    (element) =>
      element.scrollWidth <= element.clientWidth + 1 &&
      element.getBoundingClientRect().right <= window.innerWidth + 1,
  );
  assert.ok(fits, "long Armenian word should not overflow its card");

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
  await waitForText("语法不是围墙");
  await waitForText("一条慢慢变清晰的路。");
  await page.goto(`${baseURL}/grammar/to-be`, { waitUntil: "networkidle" });
  assert.ok((await page.locator("h1").innerText()).includes("是"));
  await page.getByText(/题小测/).first().waitFor({ timeout: 10_000 });

  // Reading: text list, text detail, vocabulary, and the print/hand switch.
  await page.goto(`${baseURL}/reading`, { waitUntil: "networkidle" });
  await waitForText("我的早晨");
  await page.goto(`${baseURL}/reading/my-morning`, { waitUntil: "networkidle" });
  assert.ok((await page.locator("h1").innerText()).includes("我的早晨"));
  await waitForText("生词");
  await waitForText("语法点");
  await page.getByRole("button", { name: "手写" }).click();
  assert.equal(await page.getByRole("button", { name: "手写" }).getAttribute("aria-pressed"), "true");

  // Admin onboarding, template download, JSON upload, and delete.
  await page.goto(`${baseURL}/admin?welcome=1`, { waitUntil: "networkidle" });
  await waitForText("内容管理。");
  await waitForText("你已经是这个实例的管理员。");
  const templateHref = await page
    .getByRole("link", { name: "下载模板" })
    .first()
    .getAttribute("href");
  assert.equal(templateHref, "/templates/word-upload.json");

  const adminWord = {
    id: "e2e-tsiatsanaguyn",
    hy: "ծիածանագույն",
    translit: "tsiatsanaguyn",
    pos: "adjective",
    level: "A1",
    category: "nature",
    en: "rainbow-colored",
    ru: "радужный",
    zh: "彩虹色的",
    example: {
      hy: "Երեխան նկարեց ծիածանագույն երազ։",
      translit: "Yerekhan nkarets' tsiatsanaguyn yeraz.",
      en: "The child drew a rainbow-colored dream.",
      zh: "孩子画了一个彩虹色的梦。",
    },
  };

  await page.locator("#admin-json-upload").setInputFiles({
    name: "e2e-word.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ words: [adminWord] })),
  });
  await page.getByRole("button", { name: "确认导入" }).click();
  await waitForText("已保存 1 个词条", 15_000);

  await page.goto(`${baseURL}/dictionary`, { waitUntil: "networkidle" });
  await search.fill(adminWord.hy);
  await page.waitForTimeout(600);
  assert.equal(await page.locator("button[aria-label^='查看词条']").count(), 1);

  await page.goto(`${baseURL}/admin`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: `删除词条 ${adminWord.hy}` }).click();
  await page.getByRole("button", { name: "确认", exact: true }).click();
  await page.waitForTimeout(1500);

  await page.goto(`${baseURL}/dictionary`, { waitUntil: "networkidle" });
  await search.fill(adminWord.hy);
  await page.waitForTimeout(600);
  assert.equal(await page.locator("button[aria-label^='查看词条']").count(), 0);

  // Writing: create a draft, autosave it, then remove it again.
  await page.goto(`${baseURL}/write`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "新建文章" }).first().click();
  await page.waitForTimeout(600);
  const writingTitle = `自动化测试 ${Date.now().toString(36)}`;
  await page.fill('input[aria-label="文章标题"]', writingTitle);
  const autosave = page.waitForResponse(
    (response) =>
      response.url().includes("/api/writings/") &&
      response.request().method() === "PATCH" &&
      response.status() === 200,
    { timeout: 30_000 },
  );
  await page.fill(
    'textarea[aria-label="亚美尼亚语正文"]',
    "Սա փորձնական նախադասություն է։",
  );
  await autosave;
  await page.waitForFunction(() => document.body.innerText.includes("已保存"), null, {
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "删除文章" }).click();
  await page.getByRole("button", { name: "永久删除" }).click();
  await page.waitForTimeout(700);

  assert.deepEqual(errors, []);
  console.log(
    "E2E OK — theme, dictionary, long words, login, review, grammar, admin upload/delete, and writing are working.",
  );
} finally {
  await browser.close();
}
