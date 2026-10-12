import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const port = 4173;
const basePath = "/the-journey/";

const server = spawn(
  "npm",
  ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(port)],
  { stdio: ["ignore", "pipe", "pipe"] }
);

let output = "";
server.stdout.on("data", d => { output += d.toString(); });
server.stderr.on("data", d => { output += d.toString(); });

const sleep = ms => new Promise(r => setTimeout(r, ms));

const assertWcagAA = async (page, label) => {
  const violations = await page.evaluate(async () => {
    const report = await axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
      }
    });
    return report.violations.map(violation => ({
      rule: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map(node => ({
        target: node.target,
        summary: node.failureSummary
      }))
    }));
  });
  if (violations.length) {
    throw new Error("WCAG A/AA accessibility failures on " + label + ":\\n" + JSON.stringify(violations, null, 2));
  }
  console.log("WCAG A/AA audit passed:", label);
};



try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try {
      const response = await fetch("http://127.0.0.1:" + port + basePath);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await sleep(200);
  }
  if (!ready) throw new Error("Vite preview did not start at " + basePath + ".\n" + output);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("journey_user", JSON.stringify({name:"Smoke Test", email:"smoke@example.com"}));
    localStorage.setItem("journey_onboarded", "1");
  });
  const errors = [];

  page.on("pageerror", error => errors.push(error.message));
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  const response = await page.goto(
    "http://127.0.0.1:" + port + basePath,
    { waitUntil: "domcontentloaded" }
  );

  if (!response?.ok()) {
    throw new Error("Preview returned HTTP " + response?.status() + " for " + basePath);
  }

  await page.waitForTimeout(1200);
  await page.addScriptTag({ path: resolve("node_modules/axe-core/axe.min.js") });
  await assertWcagAA(page, "home dashboard");

  const bodyText = await page.locator("body").innerText();
  const rootHtml = await page.locator("#root").innerHTML();

  if (!rootHtml.trim()) throw new Error("React root is empty at " + basePath);
  if (!bodyText.trim()) throw new Error("Rendered page has no visible text.");
  if (errors.length) throw new Error("Browser errors:\n" + errors.join("\n"));

  const checkScreen = async (label, expectedText) => {
    const button = page.locator("button").filter({ hasText: label }).first();
    const count = await button.count();
    if (!count) {
      const visible = await page.locator("body").innerText();
      const storage = await page.evaluate(() => ({
        user: localStorage.getItem("journey_user"),
        onboarded: localStorage.getItem("journey_onboarded")
      }));
      throw new Error("Navigation button not found: " + label + "\nVisible text:\n" + visible.slice(0, 2000) + "\nStorage:\n" + JSON.stringify(storage));
    }
    await button.click();
    await page.waitForTimeout(250);
    const text = await page.locator("body").innerText();
    if (!text.includes(expectedText)) {
      throw new Error("Screen check failed for " + label + ": expected visible text " + expectedText + "\nVisible text:\n" + text.slice(0, 2000));
    }
    await assertWcagAA(page, label);
  };

  await checkScreen("Bible", "The Bible");
  await checkScreen("Bible AI", "Bible Guide");
  await checkScreen("Games", "Bible Games");

  // Test the first impression without localStorage or an existing account.
  const authPage = await browser.newPage();
  const authErrors = [];
  authPage.on("pageerror", error => authErrors.push(error.message));
  authPage.on("console", msg => {
    if (msg.type() === "error") authErrors.push(msg.text());
  });
  const authResponse = await authPage.goto("http://127.0.0.1:" + port + basePath, { waitUntil: "domcontentloaded" });
  if (!authResponse?.ok()) throw new Error("Logged-out screen returned HTTP " + authResponse?.status());
  await authPage.waitForTimeout(500);
  await authPage.setViewportSize({ width: 390, height: 844 });
  await authPage.addScriptTag({ path: resolve("node_modules/axe-core/axe.min.js") });
  await assertWcagAA(authPage, "mobile logged-out welcome");
  const authText = await authPage.locator("body").innerText();
  if (!authText.includes("Make room for") || !authText.includes("Jesus Christ is King and Lord.")) {
    throw new Error("Redesigned welcome screen is missing expected content. Visible text:\\n" + authText.slice(0, 1600));
  }
  if (!(await authPage.locator(".auth-showcase").isVisible())) throw new Error("Welcome showcase is not visible.");
  const hasHorizontalOverflow = await authPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (hasHorizontalOverflow) throw new Error("Welcome screen overflows horizontally at 390px.");
  if (authErrors.length) throw new Error("Welcome screen browser errors:\\n" + authErrors.join("\\n"));
  await authPage.close();

  console.log("Runtime smoke test passed for " + basePath + ", dashboard routes, and redesigned mobile welcome screen.");
  console.log("Visible text characters:", bodyText.trim().length);

  await browser.close();
} finally {
  server.kill("SIGTERM");
}
