import { chromium } from "playwright";
import { spawn } from "node:child_process";

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

  const bodyText = await page.locator("body").innerText();
  const rootHtml = await page.locator("#root").innerHTML();

  if (!rootHtml.trim()) throw new Error("React root is empty at " + basePath);
  if (!bodyText.trim()) throw new Error("Rendered page has no visible text.");
  if (errors.length) throw new Error("Browser errors:\n" + errors.join("\n"));

  const checkScreen = async (label, expectedText) => {
    const button = page.getByRole("button", { name: label, exact: true });
    await button.click();
    await page.waitForTimeout(250);
    const text = await page.locator("body").innerText();
    if (!text.includes(expectedText)) {
      throw new Error("Screen check failed for " + label + ": expected visible text " + expectedText);
    }
  };

  await checkScreen("Bible", "The Bible");
  await checkScreen("Bible AI", "Bible Guide");
  await checkScreen("Games", "Bible Games");

  console.log("Runtime smoke test passed for " + basePath + " and checked Bible, Bible AI, and Games.");
  console.log("Visible text characters:", bodyText.trim().length);

  await browser.close();
} finally {
  server.kill("SIGTERM");
}
