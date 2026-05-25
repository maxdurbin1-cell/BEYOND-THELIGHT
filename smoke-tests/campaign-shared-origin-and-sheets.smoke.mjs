import { spawn } from "node:child_process";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.SMOKE_URL || "http://127.0.0.1:3000";
const START_TIMEOUT_MS = 20000;
const STEP_TIMEOUT_MS = 40000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (_err) {
      // retry
    }
    await wait(300);
  }
  throw new Error(`Server did not become ready at ${url} within ${timeoutMs}ms`);
}

async function dismissBlockingOverlays(page) {
  await page.evaluate(() => {
    try {
      if (window.introSystem && typeof window.introSystem.skipIntro === "function") {
        window.introSystem.skipIntro();
      }
    } catch (_err) {}
    try {
      if (typeof window.closeModal === "function") {
        window.closeModal();
      }
    } catch (_err) {}
  });
}

async function waitForCampaignReady(page) {
  await page.waitForFunction(
    () => !!(window.campaignSystem && window.campaignSystem.getState && window.campaignSystem.getState().connected),
    null,
    { timeout: STEP_TIMEOUT_MS }
  );
  await dismissBlockingOverlays(page);
}

async function clearSession(page) {
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
}

async function buildCharacterAndOrigin(page, playerLabel, reason) {
  await page.evaluate(({ label, why }) => {
    if (typeof window.generateCharacter === "function") {
      try { window.generateCharacter(); } catch (_err) {}
    }
    if (typeof window.S !== "undefined" && window.S) {
      window.S.name = String(label || "Wayfarer");
      if (!window.S.reason) window.S.reason = String(why || "find a better route");
    }
    if (typeof window.createOriginMissionFromReason === "function") {
      try { window.createOriginMissionFromReason(true, { suppressFocus: true }); } catch (_err) {}
    }
  }, { label: playerLabel, why: reason });
}

async function runScenario(browser) {
  const gmPage = await browser.newPage();
  const p1Page = await browser.newPage();

  for (const page of [gmPage, p1Page]) {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForCampaignReady(page);
    await clearSession(page);
  }

  await gmPage.evaluate(() => {
    const el = document.getElementById("campaignNameInput");
    if (el) el.value = "Sheet+Origin GM";
  });
  await gmPage.evaluate(async () => {
    await window.campaignSystem.createCampaign();
  });

  const code = await gmPage.evaluate(() => {
    const st = window.campaignSystem.getState();
    return st && st.code ? st.code : "";
  });
  if (!code) throw new Error("Failed to create campaign code.");

  await p1Page.evaluate(async (campaignCode) => {
    await window.campaignSystem.joinCampaign("player", { code: campaignCode, name: "Sheet+Origin P1" });
  }, code);

  await p1Page.waitForFunction(
    (campaignCode) => {
      const st = window.campaignSystem.getState();
      return !!(st && st.code === campaignCode && st.role === "player");
    },
    code,
    { timeout: STEP_TIMEOUT_MS }
  );

  await buildCharacterAndOrigin(gmPage, "GM Atlas", "recover old convoy manifests");
  await buildCharacterAndOrigin(p1Page, "P1 Vesper", "pay a reef-syndicate debt");

  await gmPage.waitForFunction(
    () => {
      const st = window.campaignSystem && window.campaignSystem.getState ? window.campaignSystem.getState() : null;
      const campaign = st && st.campaign ? st.campaign : null;
      const shared = campaign && campaign.shared && campaign.shared.state ? campaign.shared.state : {};
      const roster = Array.isArray(campaign && campaign.roster) ? campaign.roster : [];
      const missions = Array.isArray(shared && shared.activeMissions) ? shared.activeMissions : [];
      const origins = missions.filter((m) => m && m.missionType === "origin_story");
      const ownerTokens = new Set(origins.map((m) => String(m.originOwnerToken || "")).filter(Boolean));
      const syncedSheets = roster.filter((m) => m && m.character && m.character.loadout && Array.isArray(m.character.hacks));
      return origins.length >= 2 && ownerTokens.size >= 2 && syncedSheets.length >= 2;
    },
    null,
    { timeout: STEP_TIMEOUT_MS }
  );

  await p1Page.waitForFunction(
    () => {
      const s = typeof window.S !== "undefined" ? window.S : null;
      const missions = Array.isArray(s && s.activeMissions) ? s.activeMissions : [];
      const origins = missions.filter((m) => m && m.missionType === "origin_story");
      const ownerTokens = new Set(origins.map((m) => String(m.originOwnerToken || "")).filter(Boolean));
      return origins.length >= 2 && ownerTokens.size >= 2;
    },
    null,
    { timeout: STEP_TIMEOUT_MS }
  );

  const gmSummary = await gmPage.evaluate(() => {
    const st = window.campaignSystem.getState();
    const roster = Array.isArray(st && st.campaign && st.campaign.roster) ? st.campaign.roster : [];
    const shared = st && st.campaign && st.campaign.shared && st.campaign.shared.state ? st.campaign.shared.state : {};
    const origins = (Array.isArray(shared.activeMissions) ? shared.activeMissions : [])
      .filter((m) => m && m.missionType === "origin_story");

    const sheetChecks = roster.map((member) => {
      let opened = false;
      try {
        if (window.campaignSystem && typeof window.campaignSystem.viewRosterSheet === "function") {
          window.campaignSystem.viewRosterSheet(member.token);
          opened = true;
        }
      } catch (_err) {
        opened = false;
      }
      return {
        token: String(member && member.token || ""),
        hasCharacter: !!(member && member.character),
        hasLoadout: !!(member && member.character && member.character.loadout),
        hasHacks: !!(member && member.character && Array.isArray(member.character.hacks)),
        opened
      };
    });

    return {
      rosterSize: roster.length,
      originCount: origins.length,
      ownerTokenCount: new Set(origins.map((m) => String(m.originOwnerToken || "")).filter(Boolean)).size,
      sheetChecks
    };
  });

  if (gmSummary.rosterSize < 2) {
    throw new Error(`Roster did not include both players: ${JSON.stringify(gmSummary)}`);
  }
  if (gmSummary.originCount < 2 || gmSummary.ownerTokenCount < 2) {
    throw new Error(`Shared origin missions were not preserved for both players: ${JSON.stringify(gmSummary)}`);
  }
  if (!gmSummary.sheetChecks.every((row) => row.hasCharacter && row.hasLoadout && row.hasHacks && row.opened)) {
    throw new Error(`GM could not open full synced sheets for all players: ${JSON.stringify(gmSummary)}`);
  }

  return {
    ok: true,
    code,
    gmSummary
  };
}

async function main() {
  const server = startServer();
  let browser;
  try {
    await waitForServer(BASE_URL, START_TIMEOUT_MS);
    browser = await chromium.launch({ headless: true });
    const summary = await runScenario(browser);
    process.stdout.write(`[smoke] campaign-shared-origin-and-sheets summary: ${JSON.stringify(summary)}\n`);
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
  process.stderr.write(`[smoke] campaign-shared-origin-and-sheets failed: ${String(err && err.stack ? err.stack : err)}\n`);
  process.exit(1);
});
