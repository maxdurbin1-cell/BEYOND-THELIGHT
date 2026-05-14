import { spawn } from "node:child_process";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.SMOKE_URL || "http://127.0.0.1:3000";
const START_TIMEOUT_MS = 20000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (_err) {
      // Retry.
    }
    await wait(300);
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

async function runAssertions(page) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await dismissBlockingOverlays(page);

  const result = await page.evaluate(() => {
    if (typeof window.openMiniGamesMode !== "function") {
      return { ok: false, error: "openMiniGamesMode missing" };
    }
    if (typeof window.arcboardExecuteAction !== "function") {
      return { ok: false, error: "arcboardExecuteAction missing" };
    }

    if (window.settingsSystem && typeof window.settingsSystem.setGameMode === "function") {
      try {
        window.settingsSystem.setGameMode("solo", { silent: true });
      } catch (_err) {}
    }

    window.openMiniGamesMode("arcboard");

    const rootBefore = document.getElementById("arcboardRoot");
    const executeBtn = document.getElementById("arcboardExecuteBtn");
    const logBeforeDom = String((document.getElementById("arcboardLog") && document.getElementById("arcboardLog").textContent) || "");
    if (!rootBefore || !executeBtn) {
      return { ok: false, error: "arcboard panel not rendered", hasRoot: !!rootBefore, hasExecuteBtn: !!executeBtn };
    }

    const state = (typeof S !== "undefined" && S) ? S : (window.S || null);
    const arc = state && state.holding && state.holding.minigames ? state.holding.minigames.arcboard : null;
    if (!arc || !arc.active) {
      return { ok: false, error: "arcboard state not active" };
    }

    const ally = (arc.allies || []).find((u) => u && String(u.id || "") === String(arc.selectedUnitId || "")) || (arc.allies || [])[0];
    const enemy = (arc.enemies || []).find((u) => u && String(u.id || "") === String(arc.selectedTargetId || "")) || (arc.enemies || [])[0];
    if (!ally || !enemy) {
      return { ok: false, error: "missing ally/enemy unit for strike test" };
    }

    ally.position = { q: -1, r: 0 };
    enemy.position = { q: 0, r: 0 };
    ally.ap = 2;
    arc.selectedUnitId = String(ally.id || "");
    arc.selectedTargetId = String(enemy.id || "");

    const logLenBefore = Array.isArray(arc.log) ? arc.log.length : 0;
    const enemyHpBefore = Number(enemy.hp || 0);

    const executed = window.arcboardExecuteAction();

    const logLenAfter = Array.isArray(arc.log) ? arc.log.length : 0;
    const logTail = Array.isArray(arc.log) ? arc.log.slice(-4) : [];
    const strikeLogged = logTail.some((line) => /Strike:/i.test(String(line || "")));
    const enemyHpAfter = Number(enemy.hp || 0);

    if (typeof window.renderMiniGamesPage === "function") {
      window.renderMiniGamesPage();
    }
    const logAfterDom = String((document.getElementById("arcboardLog") && document.getElementById("arcboardLog").textContent) || "");

    return {
      ok: true,
      executed,
      rendered: !!rootBefore,
      logLenBefore,
      logLenAfter,
      strikeLogged,
      enemyHpBefore,
      enemyHpAfter,
      logBeforeDomSnippet: logBeforeDom.slice(0, 120),
      logAfterDomSnippet: logAfterDom.slice(0, 200),
      logTail
    };
  });

  if (!result || !result.ok) {
    throw new Error(`Arcboard smoke setup failed: ${JSON.stringify(result)}`);
  }
  if (!result.rendered) {
    throw new Error(`Arcboard panel did not render: ${JSON.stringify(result)}`);
  }
  if (!result.executed) {
    throw new Error(`Arcboard strike action did not execute: ${JSON.stringify(result)}`);
  }
  if (result.logLenAfter <= result.logLenBefore || !result.strikeLogged) {
    throw new Error(`Arcboard strike log did not update: ${JSON.stringify(result)}`);
  }
  if (!/Strike:/i.test(result.logAfterDomSnippet)) {
    throw new Error(`Arcboard DOM log missing strike entry: ${JSON.stringify(result)}`);
  }

  return result;
}

async function main() {
  const server = startServer();
  let browser;
  try {
    await waitForServer(BASE_URL, START_TIMEOUT_MS);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const result = await runAssertions(page);
    process.stdout.write(`Arcboard smoke passed: ${JSON.stringify(result)}\n`);
  } finally {
    if (browser) await browser.close();
    if (server && !server.killed) {
      server.kill("SIGTERM");
      await wait(200);
      if (!server.killed) server.kill("SIGKILL");
    }
  }
}

main().catch((err) => {
  process.stderr.write(`${err && err.stack ? err.stack : err}\n`);
  process.exitCode = 1;
});
