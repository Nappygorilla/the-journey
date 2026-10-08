import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
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

  const bodyText = await page.locator("body").innerText();
  const rootText = await page.locator("#root").innerText();
  if (!rootText.trim()) throw new Error("Fallback root is empty.");
  if (!bodyText.includes("The Journey")) throw new Error("Fallback did not render The Journey.");
  if (!bodyText.includes("Home")) throw new Error("Fallback did not render navigation.");
  if (bodyText.includes("Loading your Scripture and faith tools…")) {
    throw new Error("Fallback remained on the loading screen.");
  }
  if (errors.length) throw new Error("Fallback browser errors:\n" + errors.join("\n"));

  console.log("Branch fallback smoke test passed.");
  console.log("Rendered characters:", bodyText.trim().length);
} finally {
  await browser?.close().catch(() => {});
  server.close();
}
