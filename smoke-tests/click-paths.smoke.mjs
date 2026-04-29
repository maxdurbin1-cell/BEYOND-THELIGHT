import { spawn } from "node:child_process";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.SMOKE_URL || "http://127.0.0.1:3000";
const START_TIMEOUT_MS = 20000;
const CLICK_LIMIT = 280;
const MULTI_CLIENT_TIMEOUT_MS = 25000;

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

async function waitForCampaignReady(page, label) {
  await page.waitForFunction(
    () => !!(window.campaignSystem && window.campaignSystem.getState && window.campaignSystem.getState().connected),
    null,
    { timeout: MULTI_CLIENT_TIMEOUT_MS }
  );
  await dismissBlockingOverlays(page);
  try {
    await page.evaluate(() => {
      if (window.campaignSystem && typeof window.campaignSystem.showOnboarding === "function") {
        window.campaignSystem.showOnboarding(false);
      }
    });
  } catch (_err) {
    // Non-fatal.
  }
  await dismissBlockingOverlays(page);
  if (!label) return;
}

async function collectMapSummary(page) {
  return page.evaluate(() => {
    const province = (typeof window.getProvinceMapState === "function") ? window.getProvinceMapState() : null;
    const provinceCells = province && Array.isArray(province.mapData) ? province.mapData.length : 0;
    const seaCells = (window.S && window.S.lastSea && Array.isArray(window.S.lastSea.map)) ? window.S.lastSea.map.length : 0;
    const galaxyCells = (window.S && window.S.starSystem && Array.isArray(window.S.starSystem.hexes)) ? window.S.starSystem.hexes.length : 0;
    const worldCells = (window.S && window.S.worldThatWas && Array.isArray(window.S.worldThatWas.hexes)) ? window.S.worldThatWas.hexes.length : 0;
    return { provinceCells, seaCells, galaxyCells, worldCells };
  });
}

function hasAllGeneratedMaps(summary) {
  return !!(
    summary &&
    Number(summary.provinceCells || 0) > 0 &&
    Number(summary.seaCells || 0) > 0 &&
    Number(summary.galaxyCells || 0) > 0 &&
    Number(summary.worldCells || 0) > 0
  );
}

function expectedHydrationFromGmSummary(summary) {
  const s = summary || {};
  return {
    provinceCells: Number(s.provinceCells || 0),
    seaCells: Number(s.seaCells || 0),
    galaxyCells: Number(s.galaxyCells || 0),
    worldCells: Number(s.worldCells || 0)
  };
}

async function waitForHydratedMaps(page, label, expected) {
  const goal = expectedHydrationFromGmSummary(expected);
  await page.waitForFunction(
    (target) => {
      const province = (typeof window.getProvinceMapState === "function") ? window.getProvinceMapState() : null;
      const provinceCells = province && Array.isArray(province.mapData) ? province.mapData.length : 0;
      const seaCells = (window.S && window.S.lastSea && Array.isArray(window.S.lastSea.map)) ? window.S.lastSea.map.length : 0;
      const galaxyCells = (window.S && window.S.starSystem && Array.isArray(window.S.starSystem.hexes)) ? window.S.starSystem.hexes.length : 0;
      const worldCells = (window.S && window.S.worldThatWas && Array.isArray(window.S.worldThatWas.hexes)) ? window.S.worldThatWas.hexes.length : 0;
      const provinceOk = target.provinceCells > 0 ? provinceCells > 0 : true;
      const seaOk = target.seaCells > 0 ? seaCells > 0 : true;
      const galaxyOk = target.galaxyCells > 0 ? galaxyCells > 0 : true;
      const worldOk = target.worldCells > 0 ? worldCells > 0 : true;
      return provinceOk && seaOk && galaxyOk && worldOk;
    },
    goal,
    { timeout: MULTI_CLIENT_TIMEOUT_MS }
  );

  const summary = await collectMapSummary(page);
  if (
    (goal.provinceCells > 0 && summary.provinceCells <= 0) ||
    (goal.seaCells > 0 && summary.seaCells <= 0) ||
    (goal.galaxyCells > 0 && summary.galaxyCells <= 0) ||
    (goal.worldCells > 0 && summary.worldCells <= 0)
  ) {
    throw new Error(`${label} map hydration incomplete: expected=${JSON.stringify(goal)} actual=${JSON.stringify(summary)}`);
  }
}

async function runMultiClientSyncAssertions(browser, pageErrors) {
  const gmPage = await browser.newPage();
  const playerPage = await browser.newPage();
  const lateJoinPage = await browser.newPage();

  [gmPage, playerPage, lateJoinPage].forEach((page, idx) => {
    page.on("pageerror", (err) => {
      pageErrors.push(`Client ${idx + 1}: ${String(err && err.message ? err.message : err)}`);
    });
  });

  await gmPage.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await playerPage.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await lateJoinPage.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

  await dismissBlockingOverlays(gmPage);
  await dismissBlockingOverlays(playerPage);
  await dismissBlockingOverlays(lateJoinPage);

  for (const page of [gmPage, playerPage, lateJoinPage]) {
    await page.evaluate(async () => {
      try {
        localStorage.removeItem("beyond-light-campaign-session");
      } catch (_err) {}
      try {
        if (window.campaignSystem && window.campaignSystem.getState) {
          const st = window.campaignSystem.getState();
          if (st && st.code && typeof window.campaignSystem.leaveCampaign === "function") {
            await window.campaignSystem.leaveCampaign();
          }
        }
      } catch (_err) {}
    });
    await dismissBlockingOverlays(page);
  }

  await waitForCampaignReady(gmPage, "GM");
  await waitForCampaignReady(playerPage, "Player");
  await waitForCampaignReady(lateJoinPage, "LateJoin");

  await gmPage.evaluate(() => {
    const el = document.getElementById("campaignNameInput");
    if (el) el.value = "Smoke GM";
  });
  await gmPage.evaluate(async () => {
    await window.campaignSystem.createCampaign();
  });

  await gmPage.waitForFunction(
    () => {
      const st = window.campaignSystem.getState();
      return !!(st && st.code && st.role === "gm");
    },
    null,
    { timeout: MULTI_CLIENT_TIMEOUT_MS }
  );

  const code = await gmPage.evaluate(() => window.campaignSystem.getState().code || "");
  if (!code) {
    throw new Error("GM campaign creation assertion failed: no campaign code allocated.");
  }

  await playerPage.evaluate(async (campaignCode) => {
    await window.campaignSystem.joinCampaign("player", { code: campaignCode, name: "Smoke Player" });
  }, code);

  await playerPage.waitForFunction(
    (campaignCode) => {
      const st = window.campaignSystem.getState();
      return !!(st && st.code === campaignCode && st.role === "player");
    },
    code,
    { timeout: MULTI_CLIENT_TIMEOUT_MS }
  );

  const generatedInfo = await gmPage.evaluate(async () => {
    const diagnostics = [];
    const resolveFn = (name) => {
      if (typeof window[name] === "function") return window[name];
      try {
        const maybe = Function(`return (typeof ${name} === 'function') ? ${name} : null;`)();
        return typeof maybe === "function" ? maybe : null;
      } catch (_err) {
        return null;
      }
    };

    const provinceFn = resolveFn("generateMap");
    const seaFn = resolveFn("generateLastSea");
    const galaxyFn = resolveFn("generateStarSystemMap");
    const worldFn = resolveFn("generateWorldThatWasMap");

    diagnostics.push(`fn:province=${!!provinceFn},sea=${!!seaFn},galaxy=${!!galaxyFn},world=${!!worldFn}`);
    if (provinceFn) {
      try { provinceFn(); } catch (err) { diagnostics.push(`province:${String(err && err.message ? err.message : err)}`); }
    }
    if (seaFn) {
      try { seaFn(); } catch (err) { diagnostics.push(`sea:${String(err && err.message ? err.message : err)}`); }
    }
    if (galaxyFn) {
      try { galaxyFn("cluster"); } catch (err) { diagnostics.push(`galaxy:${String(err && err.message ? err.message : err)}`); }
    }
    if (worldFn) {
      try { worldFn(); } catch (err) { diagnostics.push(`world:${String(err && err.message ? err.message : err)}`); }
    }

    const res = await window.campaignSystem.syncSharedSilent("smoke-multi-client-map-sync");
    return { ok: !!(res && res.ok), diagnostics };
  });
  if (!generatedInfo || !generatedInfo.ok) {
    throw new Error(`GM map generation sync assertion failed: ${JSON.stringify(generatedInfo)}`);
  }

  const gmSummary = await collectMapSummary(gmPage);
  if (gmSummary.provinceCells <= 0) {
    throw new Error(`GM province map generation assertion failed: summary=${JSON.stringify(gmSummary)} diagnostics=${JSON.stringify(generatedInfo)}`);
  }

  await waitForHydratedMaps(playerPage, "Player", gmSummary);

  await lateJoinPage.evaluate(async (campaignCode) => {
    await window.campaignSystem.joinCampaign("player", { code: campaignCode, name: "Smoke Late Join" });
  }, code);

  await lateJoinPage.waitForFunction(
    (campaignCode) => {
      const st = window.campaignSystem.getState();
      return !!(st && st.code === campaignCode && st.role === "player");
    },
    code,
    { timeout: MULTI_CLIENT_TIMEOUT_MS }
  );

  await waitForHydratedMaps(lateJoinPage, "LateJoin", gmSummary);

  const playerSummary = await collectMapSummary(playerPage);
  const lateSummary = await collectMapSummary(lateJoinPage);
  process.stdout.write(
    `Multi-client sync assertions passed: code=${code}, gm=${JSON.stringify(gmSummary)}, player=${JSON.stringify(playerSummary)}, lateJoin=${JSON.stringify(lateSummary)}\n`
  );

  await gmPage.close();
  await playerPage.close();
  await lateJoinPage.close();
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
    await runMultiClientSyncAssertions(browser, pageErrors);

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
