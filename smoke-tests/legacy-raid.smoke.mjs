import { spawn } from "node:child_process";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.SMOKE_URL || "http://127.0.0.1:3000";
const START_TIMEOUT_MS = 20000;
const STEP_TIMEOUT_MS = 30000;

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
      // Retry until timeout.
    }
    await wait(350);
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

async function runScenario(browser) {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (err) => {
    pageErrors.push(String(err && err.message ? err.message : err));
  });

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await dismissBlockingOverlays(page);

  await page.waitForFunction(
    () => {
      return !!(
        window.progressSolarCycleDay &&
        window.setSolarCycleStoryModeEnabled &&
        window.renderNewSunModePanel &&
        window.openLegacyRaidMissionPopup &&
        window.renderMissionTracker
      );
    },
    null,
    { timeout: STEP_TIMEOUT_MS }
  );

  const summary = await page.evaluate(() => {
    if (window.settingsSystem && typeof window.settingsSystem.setGameMode === "function") {
      window.settingsSystem.setGameMode("solo", { silent: true });
    }

    if (typeof window.generateMap === "function") window.generateMap();
    if (typeof window.generateLastSea === "function") window.generateLastSea();
    if (typeof window.generateWorldThatWasMap === "function") window.generateWorldThatWasMap();
    if (typeof window.generateStarSystemMap === "function") window.generateStarSystemMap("cluster");

    const status = window.getSolarCycleStatus ? (window.getSolarCycleStatus() || {}) : {};
    if (!status.enabled && typeof window.startSolarCycleMode === "function") {
      window.startSolarCycleMode("relic");
    }
    if (typeof window.setSolarCycleStoryModeEnabled === "function") {
      window.setSolarCycleStoryModeEnabled(false);
    }
    if (typeof window.setSolarCycleRouteMode === "function") {
      window.setSolarCycleRouteMode("straight");
    }
    if (typeof window.renderNewSunModePanel === "function") {
      window.renderNewSunModePanel();
    }

    function activeRaidMission() {
      const missions = Array.isArray(window.S && window.S.activeMissions) ? window.S.activeMissions : [];
      return missions.find((mission) => mission && mission.missionType === "legacy_raid") || null;
    }

    let mission = activeRaidMission();
    let guard = 0;
    while (!mission && guard < 120) {
      guard += 1;
      if (typeof window.progressSolarCycleDay === "function") {
        window.progressSolarCycleDay(1);
      }
      if (typeof window.renderNewSunModePanel === "function") {
        window.renderNewSunModePanel();
      }
      mission = activeRaidMission();
    }

    if (!mission) {
      if (typeof window.createMission === "function") {
        mission = window.createMission(
          "Raid Signal",
          "Smoke Legacy Raid: Ember Tyrant",
          "hard",
          "Province",
          "province",
          "Test Hostiles",
          {
            missionType: "legacy_raid",
            storyTheme: "legacy_raid",
            stepNames: {
              1: "Breach the Lore Wing",
              2: "Solve the Intricate Gate Puzzle",
              3: "Defeat Ember Tyrant"
            },
            checkpoints: [
              "Recover the lore cache before the raid marker collapses.",
              "Rotate runners through the gate puzzle while the front line handles pressure.",
              "Defeat Ember Tyrant with allied Traveling Wayfarers covering failed positions."
            ],
            step1Intro: "The raid opens with a story gate that explains why the boss threatens the region.",
            lore: "Boss actions: cleaving flame arcs; floor-collapse telegraph; ash storm displacement."
          }
        );
      }
      if (mission) {
        mission.legacyRaidBoss = "Ember Tyrant";
        mission.legacyRaidPuzzle = "Rotate the ember seals in the correct order while lane pressure escalates.";
        mission.legacyRaidRegion = "province";
        mission.legacyRaidMedalReward = 1;
        mission.legacyRaidPointReward = 1;
      }
    }

    if (!mission) {
      throw new Error("Legacy raid smoke could not find or create a usable raid mission.");
    }

    if (typeof window.renderMissionTracker === "function") {
      window.renderMissionTracker();
    }
    const tracker = document.getElementById("missionTrackerContainer");
    const trackerText = tracker ? String(tracker.textContent || "") : "";
    if (!/Open Raid/i.test(trackerText)) {
      throw new Error("Mission tracker did not render the Open Raid action for the legacy raid mission.");
    }

    const raidButton = tracker
      ? Array.from(tracker.querySelectorAll("button")).find((btn) => /Open Raid/i.test(String(btn.textContent || "")))
      : null;
    if (!raidButton) {
      throw new Error("Legacy raid tracker button was not found.");
    }
    raidButton.click();

    return {
      missionId: mission.id,
      title: String(mission.title || ""),
      boss: String(mission.legacyRaidBoss || ""),
      region: String(mission.legacyRaidRegion || mission.region || "")
    };
  });

  await page.waitForFunction(() => {
    const overlay = document.getElementById("rollModal");
    const title = document.getElementById("modalTitle");
    const content = document.getElementById("modalContent");
    return !!(
      overlay &&
      overlay.classList.contains("open") &&
      title &&
      /Raid Window - /i.test(String(title.textContent || "")) &&
      content &&
      /Wing 1|Wing 2|Wing 3/i.test(String(content.textContent || "")) &&
      /Telegraphs/i.test(String(content.textContent || "")) &&
      /Front Line|Mechanics|Support/i.test(String(content.textContent || ""))
    );
  }, null, { timeout: STEP_TIMEOUT_MS });

  const modalSummary = await page.evaluate(() => {
    const title = document.getElementById("modalTitle");
    const content = document.getElementById("modalContent");
    const text = String(content && content.textContent ? content.textContent : "");
    return {
      title: String(title && title.textContent ? title.textContent : ""),
      hasRewards: /Rewards/i.test(text),
      hasCheckpoints: /Checkpoint|checkpoints/i.test(text),
      hasTelegraphs: /Telegraphs/i.test(text)
    };
  });

  await page.close();

  if (pageErrors.length) {
    throw new Error(`Legacy raid smoke saw page errors: ${pageErrors.join(" | ")}`);
  }
  if (!modalSummary.hasRewards || !modalSummary.hasCheckpoints || !modalSummary.hasTelegraphs) {
    throw new Error(`Legacy raid modal assertions failed: ${JSON.stringify(modalSummary)}`);
  }

  return { summary, modalSummary };
}

let server;
let browser;

try {
  server = startServer();
  await waitForServer(BASE_URL, START_TIMEOUT_MS);
  browser = await chromium.launch({ headless: true });
  const result = await runScenario(browser);
  console.log(`legacy raid smoke passed: region=${result.summary.region} boss=${result.summary.boss} modal=${result.modalSummary.title}`);
} catch (err) {
  console.error(err && err.stack ? err.stack : err);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server && !server.killed) {
    server.kill("SIGTERM");
  }
}