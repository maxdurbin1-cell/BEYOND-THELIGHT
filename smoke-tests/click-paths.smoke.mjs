import { spawn } from "node:child_process";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.SMOKE_URL || "http://127.0.0.1:3000";
const START_TIMEOUT_MS = 20000;
const CLICK_LIMIT = 280;

const SKIP_LABELS = [
  /delete campaign/i,
  /archive/i,
  /reopen/i,
  /leave\b/i,
  /delete\b/i,
  /reset\b/i,
  /logout/i
];

function shouldSkipLabel(label) {
  return SKIP_LABELS.some((rx) => rx.test(label || ""));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function dismissBlockingOverlays(page) {
  await page.evaluate(() => {
    try {
      if (window.introSystem && typeof window.introSystem.skipIntro === "function") {
        window.introSystem.skipIntro();
      }
    } catch (_err) {}
    try {
      if (window.soloReference && typeof window.soloReference.close === "function") {
        window.soloReference.close();
      }
    } catch (_err) {}
    try {
      if (typeof window.closeModal === "function") {
        window.closeModal();
      }
    } catch (_err) {}
  });
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (_err) {
      // Retry until timeout.
    }
    await wait(350);
  }
  throw new Error(`Server did not become ready at ${url} within ${timeoutMs}ms`);
}

function startServer() {
  const child = spawn("node", ["server.js"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: process.env.PORT || "3000" }
  });

  child.stdout.on("data", (buf) => {
    const line = String(buf || "").trim();
    if (line) process.stdout.write(`[server] ${line}\n`);
  });
  child.stderr.on("data", (buf) => {
    const line = String(buf || "").trim();
    if (line) process.stderr.write(`[server:err] ${line}\n`);
  });

  return child;
}

async function run() {
  const server = startServer();
  let browser;
  const failures = [];
  const pageErrors = [];

  try {
    await waitForServer(BASE_URL, START_TIMEOUT_MS);

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on("pageerror", (err) => {
      pageErrors.push(String(err && err.message ? err.message : err));
    });

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await dismissBlockingOverlays(page);

    const tabButtons = page.locator(".tab-btn");
    const tabCount = await tabButtons.count();
    for (let i = 0; i < tabCount; i += 1) {
      const tab = tabButtons.nth(i);
      if (!(await tab.isVisible())) continue;
      try {
        await tab.click({ timeout: 1500 });
        await page.waitForTimeout(40);
      } catch (_err) {
        // Continue trying all tabs.
      }
    }

    const clickables = page.locator("button,[role='button'],[onclick]");
    const count = await clickables.count();
    const max = Math.min(count, CLICK_LIMIT);

    for (let i = 0; i < max; i += 1) {
      await dismissBlockingOverlays(page);
      const el = clickables.nth(i);
      if (!(await el.isVisible())) continue;
      if (!(await el.isEnabled())) continue;

      const label = ((await el.textContent()) || "").trim().replace(/\s+/g, " ").slice(0, 120);
      if (shouldSkipLabel(label)) continue;

      try {
        await el.scrollIntoViewIfNeeded();
        await el.click({ timeout: 1500 });
        await page.waitForTimeout(30);
      } catch (err) {
        const message = String(err && err.message ? err.message : err);
        if (/intercepts pointer events/i.test(message)) {
          try {
            await dismissBlockingOverlays(page);
            await el.click({ timeout: 1200, force: true });
            await page.waitForTimeout(30);
            continue;
          } catch (retryErr) {
            failures.push(`Click failed [${i}] ${label || "<unlabeled>"}: ${String(retryErr && retryErr.message ? retryErr.message : retryErr)}`);
            continue;
          }
        }
        failures.push(`Click failed [${i}] ${label || "<unlabeled>"}: ${message}`);
      }
    }

    if (pageErrors.length) {
      failures.push(...pageErrors.map((e) => `Uncaught page error: ${e}`));
    }

    if (failures.length) {
      throw new Error(`Smoke failures (${failures.length}):\n${failures.slice(0, 25).join("\n")}`);
    }

    process.stdout.write(`Smoke passed: checked up to ${max} clickable paths with no uncaught runtime errors.\n`);
  } finally {
    if (browser) await browser.close();
    if (server && !server.killed) {
      server.kill("SIGTERM");
    }
  }
}

run().catch((err) => {
  process.stderr.write(`${String(err && err.stack ? err.stack : err)}\n`);
  process.exit(1);
});
