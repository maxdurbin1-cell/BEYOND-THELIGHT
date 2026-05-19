import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";

import { chromium } from "playwright";

const START_TIMEOUT_MS = 20000;
const COMBAT_KEY = "btl-combat-scene-editor-v1";
const TUTORIAL_KEY = COMBAT_KEY + "-tutorial";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkPortOpen(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once("error", () => resolve(false));
    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, "127.0.0.1");
  });
}

async function pickAvailablePort(preferredPort = 3000) {
  if (await checkPortOpen(preferredPort)) return preferredPort;
  for (let i = 0; i < 25; i += 1) {
    const candidate = 4100 + Math.floor(Math.random() * 1400);
    if (await checkPortOpen(candidate)) return candidate;
  }
  throw new Error("Unable to find a free port for the VTT smoke server.");
}

async function waitForServer(url, child) {
  const start = Date.now();
  while (Date.now() - start < START_TIMEOUT_MS) {
    if (child.exitCode !== null) throw new Error("Smoke server exited before becoming ready.");
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok) return;
    } catch (_err) {}
    await wait(250);
  }
  throw new Error("Timed out waiting for smoke server readiness.");
}

async function dismissBlockingOverlays(page) {
  await page.evaluate(() => {
    try {
      if (window.introSystem && typeof window.introSystem.skipIntro === "function") window.introSystem.skipIntro();
    } catch (_err) {}
    try {
      if (window.soloReference && typeof window.soloReference.close === "function") window.soloReference.close();
    } catch (_err) {}
    try {
      if (typeof window.closeModal === "function") window.closeModal();
    } catch (_err) {}
  });
}

async function run() {
  const port = await pickAvailablePort(Number(process.env.PORT || 3000));
  const baseUrl = process.env.SMOKE_URL || `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: Object.assign({}, process.env, { PORT: String(port), HOST: "127.0.0.1" }),
    stdio: ["ignore", "pipe", "pipe"]
  });

  let serverLog = "";
  child.stdout.on("data", (chunk) => { serverLog += String(chunk || ""); });
  child.stderr.on("data", (chunk) => { serverLog += String(chunk || ""); });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(String(err && err.message ? err.message : err)));

  try {
    await waitForServer(baseUrl, child);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await dismissBlockingOverlays(page);

    await page.evaluate(({ combatKey, tutorialKey }) => {
      localStorage.removeItem(combatKey);
      localStorage.removeItem(tutorialKey);
    }, { combatKey: COMBAT_KEY, tutorialKey: TUTORIAL_KEY });

    await page.evaluate(() => {
      window.openCombatSceneEditor({
        id: "smoke-scene",
        name: "Smoke Scene",
        tokens: [
          { id: "player-1", name: "Wayfarer", faction: "player", hp: 12, maxHp: 12, q: 0, r: 0, size: 1, isPlayer: true },
          { id: "enemy-1", name: "Night Corsair", faction: "monster", hp: 10, maxHp: 10, q: 2, r: 0, size: 1, dread: 6, deathNumber: 6 }
        ]
      });
    });

    await page.waitForSelector("#combatModeOverlay.open", { timeout: 10000 });
    await page.waitForFunction(() => {
      const modal = document.getElementById("rollModal");
      return !!(modal && modal.style.display !== "none" && /Combat Mode Tour/.test(modal.textContent || ""));
    }, null, { timeout: 10000 });

    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Resume Later" }).click();

    const tutorialState = await page.evaluate((tutorialKey) => JSON.parse(localStorage.getItem(tutorialKey) || "{}"), TUTORIAL_KEY);
    if (Number(tutorialState.step) !== 1 || tutorialState.seen !== false) {
      throw new Error(`Tutorial resume state not persisted correctly: ${JSON.stringify(tutorialState)}`);
    }

    await page.evaluate(() => window.openCombatTutorial(1));
    await page.waitForFunction(() => {
      const modal = document.getElementById("rollModal");
      return !!(modal && /Step 2 of 7/.test(modal.textContent || ""));
    }, null, { timeout: 10000 });
    await page.evaluate(() => window.closeModal());

    const modalLayering = await page.evaluate(() => {
      const overlay = document.getElementById("combatModeOverlay");
      window.showCombatRulesReference();
      const modal = document.getElementById("rollModal");
      const rulesAbove = Number(window.getComputedStyle(modal).zIndex || 0) > Number(window.getComputedStyle(overlay).zIndex || 0);
      window.closeModal();
      window.CombatSceneStore.setState((function () {
        const st = window.CombatSceneStore.getState();
        return Object.assign({}, st, { selectedTokenId: "player-1", selectedTokenIds: ["player-1"] });
      })());
      if (typeof window.openSelectedCombatSheetFromRulesReference === "function") window.openSelectedCombatSheetFromRulesReference();
      const sheetModal = document.getElementById("rollModal");
      const sheetAbove = Number(window.getComputedStyle(sheetModal).zIndex || 0) > Number(window.getComputedStyle(overlay).zIndex || 0);
      const sheetVisible = !!sheetModal && sheetModal.style.display !== "none";
      return { rulesAbove, sheetAbove, sheetVisible };
    });

    if (!modalLayering.rulesAbove || !modalLayering.sheetAbove || !modalLayering.sheetVisible) {
      throw new Error(`Modal layering assertion failed: ${JSON.stringify(modalLayering)}`);
    }

    await page.evaluate(() => window.closeModal());
    await page.evaluate(() => {
      const st = window.CombatSceneStore.getState();
      window.CombatSceneStore.setState(Object.assign({}, st, {
        assetBrowser: Object.assign({}, st.assetBrowser || {}, { category: "objects", query: "obstacle" })
      }));
      window.combatOpenAssetsHub();
    });
    await page.waitForSelector("#combatAssetDock.open", { timeout: 10000 });
    const assetCardInfo = await page.locator('article[data-asset-id="obj-obstacle"]').evaluate((node) => ({
      draggable: !!node.getAttribute("draggable"),
      label: node.getAttribute("data-asset-label") || node.textContent || ""
    }));
    if (!assetCardInfo.draggable) {
      throw new Error(`Asset card is not draggable: ${JSON.stringify(assetCardInfo)}`);
    }

    const dragResult = await page.evaluate(() => {
      const canvas = document.getElementById("combatSceneCanvas");
      const rect = canvas.getBoundingClientRect();
      const dropped = window.debugCombatDropAsset("set-tool", "objects:obstacle", rect.left + 560, rect.top + 360);
      const st = window.CombatSceneStore.getState();
      const objectKeys = Object.keys((st.layers && st.layers.objects) || {});
      return { dropped, objectCount: objectKeys.length, lastObject: objectKeys[objectKeys.length - 1] || "" };
    });

    if (!dragResult.dropped || Number(dragResult.objectCount || 0) <= 0) {
      throw new Error(`Asset drag/drop did not stamp an object: ${JSON.stringify(dragResult)}`);
    }

    if (pageErrors.length) {
      throw new Error(`Page errors detected: ${pageErrors.join(" | ")}`);
    }

    console.log(JSON.stringify({ ok: true, tutorialState, modalLayering, dragResult }, null, 2));
  } finally {
    await browser.close();
    if (child.exitCode === null) child.kill("SIGTERM");
  }
}

run().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});