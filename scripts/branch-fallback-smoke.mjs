import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { resolve } from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const port = 4174;
const prefix = "/the-journey";
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jsx": "text/plain; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === prefix || pathname === prefix + "/") pathname = "/index.html";
    else if (pathname.startsWith(prefix + "/")) pathname = pathname.slice(prefix.length);
    if (pathname === "/") pathname = "/index.html";

    const filePath = path.resolve(root, "." + pathname);
    if (!filePath.startsWith(path.resolve(root) + path.sep)) {
      res.writeHead(403); res.end("Forbidden"); return;
    }

    const data = await fs.readFile(filePath);
    const type = contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(data);
  } catch {
    res.writeHead(404); res.end("Not found");
  }
});

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const assertColorContrast = async (page, label) => {
  const failures = await page.evaluate(async () => {
    const report = await axe.run(document, { runOnly: { type: "rule", values: ["color-contrast"] } });
    return report.violations.flatMap(violation => violation.nodes.map(node => ({
      rule: violation.id,
      target: node.target,
      summary: node.failureSummary
    })));
  });
  if (failures.length) throw new Error("WCAG color-contrast failures on " + label + ":\\n" + JSON.stringify(failures, null, 2));
  console.log("Color contrast passed:", label);
};


let browser;

try {
  await new Promise(resolve => server.listen(port, "127.0.0.1", resolve));
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("journey_user", JSON.stringify({ name: "Fallback Test", email: "fallback@example.com" }));
    localStorage.setItem("journey_onboarded", "1");
  });

  const errors = [];
  page.on("pageerror", error => errors.push("pageerror: " + error.message));
  page.on("console", msg => {
    if (msg.type() === "error") errors.push("console: " + msg.text());
  });

  const response = await page.goto(
    "http://127.0.0.1:" + port + prefix + "/",
    { waitUntil: "domcontentloaded" }
  );
  if (!response?.ok()) throw new Error("Fallback page returned HTTP " + response?.status());

  await page.waitForTimeout(2600);
  await page.addScriptTag({ path: resolve("node_modules/axe-core/axe.min.js") });
  await assertColorContrast(page, "static fallback dashboard");

  const bodyText = await page.locator("body").innerText();
  const rootText = await page.locator("#root").innerText();
  if (!rootText.trim()) throw new Error("Fallback root is empty.");
  if (!bodyText.includes("The Journey")) throw new Error("Fallback did not render The Journey.");
  if (!bodyText.includes("Home")) throw new Error("Fallback did not render navigation.");
  if (bodyText.includes("Loading your Scripture and faith tools…")) {
    throw new Error("Fallback remained on the loading screen.");
  }
  if (errors.length) throw new Error("Fallback browser errors:\\n" + errors.join("\\n"));

  // Open a clean browser context to check the logged-out welcome screen too.
  const authPage = await browser.newPage();
  const authErrors = [];
  authPage.on("pageerror", error => authErrors.push("pageerror: " + error.message));
  authPage.on("console", msg => {
    if (msg.type() === "error") authErrors.push("console: " + msg.text());
  });
  const authResponse = await authPage.goto(
    "http://127.0.0.1:" + port + prefix + "/",
    { waitUntil: "domcontentloaded" }
  );
  if (!authResponse?.ok()) throw new Error("Logged-out fallback returned HTTP " + authResponse?.status());
  await authPage.waitForTimeout(2600);
  await authPage.setViewportSize({ width: 390, height: 844 });
  await authPage.addScriptTag({ path: resolve("node_modules/axe-core/axe.min.js") });
  await assertColorContrast(authPage, "static fallback mobile welcome");
  const authText = await authPage.locator("body").innerText();
  if (!authText.includes("Make room for") || !authText.includes("Jesus Christ is King and Lord.")) {
    throw new Error("Redesigned fallback welcome screen is missing expected content. Visible text:\\n" + authText.slice(0, 1600));
  }
  if (!(await authPage.locator(".auth-showcase").isVisible())) throw new Error("Fallback welcome showcase is not visible.");
  const authOverflow = await authPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (authOverflow) throw new Error("Fallback welcome screen overflows horizontally at 390px.");
  if (authErrors.length) throw new Error("Welcome fallback browser errors:\\n" + authErrors.join("\\n"));
  await authPage.close();

  console.log("Branch fallback smoke test passed for the dashboard and redesigned mobile welcome screen.");
  console.log("Rendered characters:", bodyText.trim().length);
} finally {
  await browser?.close().catch(() => {});
  server.close();
}
