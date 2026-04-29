import { spawn } from "node:child_process";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.SMOKE_URL || "http://127.0.0.1:3000";
const START_TIMEOUT_MS = 20000;
const STEP_TIMEOUT_MS = 25000;

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
  await dismissBlockingOverlays(page);
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

async function waitForHydratedMaps(page, expected) {
  const goal = {
    provinceCells: Number(expected && expected.provinceCells || 0),
    seaCells: Number(expected && expected.seaCells || 0),
    galaxyCells: Number(expected && expected.galaxyCells || 0),
    worldCells: Number(expected && expected.worldCells || 0)
  };
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
    { timeout: STEP_TIMEOUT_MS }
  );
}

async function runScenario(browser) {
  const gmPage = await browser.newPage();
  const p1Page = await browser.newPage();
  const p2Page = await browser.newPage();

  for (const page of [gmPage, p1Page, p2Page]) {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForCampaignReady(page);
    await clearSession(page);
  }

  await gmPage.evaluate(() => {
    const el = document.getElementById("campaignNameInput");
    if (el) el.value = "Scenario GM";
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
    { timeout: STEP_TIMEOUT_MS }
  );

  const code = await gmPage.evaluate(() => window.campaignSystem.getState().code || "");
  if (!code) throw new Error("Campaign code not created by GM.");

  await p1Page.evaluate(async (campaignCode) => {
    await window.campaignSystem.joinCampaign("player", { code: campaignCode, name: "Scenario P1" });
  }, code);
  await p2Page.evaluate(async (campaignCode) => {
    await window.campaignSystem.joinCampaign("player", { code: campaignCode, name: "Scenario P2" });
  }, code);

  for (const page of [p1Page, p2Page]) {
    await page.waitForFunction(
      (campaignCode) => {
        const st = window.campaignSystem.getState();
        return !!(st && st.code === campaignCode && st.role === "player");
      },
      code,
      { timeout: STEP_TIMEOUT_MS }
    );
  }

  const genRes = await gmPage.evaluate(async () => {
    if (typeof window.generateMap === "function") window.generateMap();
    if (typeof window.generateLastSea === "function") window.generateLastSea();
    if (typeof window.generateStarSystemMap === "function") window.generateStarSystemMap("cluster");
    if (typeof window.generateWorldThatWasMap === "function") window.generateWorldThatWasMap();

    if (window.S) {
      window.S.factionRenown = { ember_fleet: 3 };
      window.S.factionBases = { ember_fleet: { trusted: true } };
      window.S.factionWayfarerTasks = [{ id: "task-1", title: "Survey route" }];
      window.S.factionNarrative = { pathPoints: { heroic: 1, tyrant: 0, martyr: 0 }, contracts: { ember_fleet: 1 } };
    }

    const sync = await window.campaignSystem.syncSharedSilent("scenario-sync");
    return { ok: !!(sync && sync.ok), sync };
  });

  if (!genRes.ok) {
    throw new Error(`GM shared sync failed: ${JSON.stringify(genRes)}`);
  }

  const factionSyncAck = await gmPage.evaluate(async () => {
    const st = window.campaignSystem && window.campaignSystem.getState ? window.campaignSystem.getState() : null;
    if (!st || !st.code || !st.token || typeof window.io !== "function") {
      return { ok: false, error: "Missing GM state/socket." };
    }
    return await new Promise((resolve) => {
      const s = window.io({ transports: ["websocket", "polling"] });
      const done = (payload) => {
        try { s.disconnect(); } catch (_err) {}
        resolve(payload || { ok: false, error: "No response" });
      };
      s.on("connect_error", (err) => done({ ok: false, error: String(err && err.message ? err.message : err) }));
      s.on("connect", () => {
        s.emit("campaign:join", {
          code: st.code,
          token: st.token,
          role: "gm",
          name: "Scenario GM"
        }, (joinAck) => {
          if (!joinAck || !joinAck.ok) {
            done({ ok: false, error: (joinAck && joinAck.error) || "join failed" });
            return;
          }
          s.emit("campaign:syncState", {
            reason: "scenario-faction-contract",
            state: {
              factionRenown: { ember_fleet: 3 },
              factionBases: { ember_fleet: { trusted: true } },
              factionWayfarerTasks: [{ id: "task-1", title: "Survey route" }],
              factionNarrative: { pathPoints: { heroic: 1, tyrant: 0, martyr: 0 }, contracts: { ember_fleet: 1 } }
            }
          }, (syncAck) => {
            done(syncAck);
          });
        });
      });
      setTimeout(() => done({ ok: false, error: "faction sync timed out" }), 12000);
    });
  });
  if (!factionSyncAck || !factionSyncAck.ok) {
    throw new Error(`Faction sync payload failed: ${JSON.stringify(factionSyncAck)}`);
  }

  const gmSummary = await collectMapSummary(gmPage);
  await waitForHydratedMaps(p1Page, gmSummary);
  await waitForHydratedMaps(p2Page, gmSummary);

  const shareAck = await p1Page.evaluate(async () => {
    const st = window.campaignSystem && window.campaignSystem.getState ? window.campaignSystem.getState() : null;
    if (!st || !st.code || !st.token || typeof window.io !== "function") {
      return { ok: false, error: "Missing player state/socket." };
    }
    return await new Promise((resolve) => {
      const s = window.io({ transports: ["websocket", "polling"] });
      const done = (payload) => {
        try { s.disconnect(); } catch (_err) {}
        resolve(payload || { ok: false, error: "No response" });
      };
      s.on("connect_error", (err) => done({ ok: false, error: String(err && err.message ? err.message : err) }));
      s.on("connect", () => {
        s.emit("campaign:join", {
          code: st.code,
          token: st.token,
          role: "player",
          name: "Scenario P1"
        }, (joinAck) => {
          if (!joinAck || !joinAck.ok) {
            done({ ok: false, error: (joinAck && joinAck.error) || "join failed" });
            return;
          }
          s.emit("campaign:stashShare", { item: "Scenario Relic" }, (shareRes) => {
            done(shareRes);
          });
        });
      });
      setTimeout(() => done({ ok: false, error: "stash share timed out" }), 12000);
    });
  });
  if (!shareAck || !shareAck.ok) {
    throw new Error(`Stash share failed: ${JSON.stringify(shareAck)}`);
  }

  await p2Page.waitForFunction(
    () => {
      const st = window.campaignSystem.getState();
      const shared = st && st.campaign && st.campaign.shared && st.campaign.shared.state ? st.campaign.shared.state : {};
      return Array.isArray(shared.partyStash) && shared.partyStash.indexOf("Scenario Relic") >= 0;
    },
    null,
    { timeout: STEP_TIMEOUT_MS }
  );

  const claimAck = await p2Page.evaluate(async () => {
    const st = window.campaignSystem && window.campaignSystem.getState ? window.campaignSystem.getState() : null;
    if (!st || !st.code || !st.token || typeof window.io !== "function") {
      return { ok: false, error: "Missing player state/socket." };
    }
    const claimRes = await new Promise((resolve) => {
      const s = window.io({ transports: ["websocket", "polling"] });
      const done = (payload) => {
        try { s.disconnect(); } catch (_err) {}
        resolve(payload || { ok: false, error: "No response" });
      };
      s.on("connect_error", (err) => done({ ok: false, error: String(err && err.message ? err.message : err) }));
      s.on("connect", () => {
        s.emit("campaign:join", {
          code: st.code,
          token: st.token,
          role: "player",
          name: "Scenario P2"
        }, (joinAck) => {
          if (!joinAck || !joinAck.ok) {
            done({ ok: false, error: (joinAck && joinAck.error) || "join failed" });
            return;
          }
          s.emit("campaign:stashClaim", { index: 0 }, (claimResult) => {
            done(claimResult);
          });
        });
      });
      setTimeout(() => done({ ok: false, error: "stash claim timed out" }), 12000);
    });

    if (!window.S || !Array.isArray(window.S.backpack)) {
      if (!window.S) window.S = {};
      window.S.backpack = Array(10).fill("");
    }
    var item = String((claimRes && claimRes.item) || "").trim();
    if (item) {
      var slot = window.S.backpack.indexOf("");
      if (slot >= 0) window.S.backpack[slot] = item;
    }
    return claimRes;
  });
  if (!claimAck || !claimAck.ok || String(claimAck.item || "") !== "Scenario Relic") {
    throw new Error(`Stash claim failed: ${JSON.stringify(claimAck)}`);
  }

  const renownAck = await gmPage.evaluate(async () => {
    const st = window.campaignSystem && window.campaignSystem.getState ? window.campaignSystem.getState() : null;
    if (!st || !st.code || !st.token || typeof window.io !== "function") {
      return { ok: false, error: "Missing GM state/socket." };
    }
    return await new Promise((resolve) => {
      const s = window.io({ transports: ["websocket", "polling"] });
      const done = (payload) => {
        try { s.disconnect(); } catch (_err) {}
        resolve(payload || { ok: false, error: "No response" });
      };
      s.on("connect_error", (err) => done({ ok: false, error: String(err && err.message ? err.message : err) }));
      s.on("connect", () => {
        s.emit("campaign:join", {
          code: st.code,
          token: st.token,
          role: "gm",
          name: "Scenario GM"
        }, (joinAck) => {
          if (!joinAck || !joinAck.ok) {
            done({ ok: false, error: (joinAck && joinAck.error) || "join failed" });
            return;
          }
          s.emit("campaign:deltaRenown", { delta: 2, reason: "scenario" }, (deltaAck) => {
            done(deltaAck);
          });
        });
      });
      setTimeout(() => done({ ok: false, error: "delta renown timed out" }), 12000);
    });
  });
  if (!renownAck || !renownAck.ok) {
    throw new Error(`Renown delta failed: ${JSON.stringify(renownAck)}`);
  }

  await p1Page.waitForFunction(
    () => {
      var st = window.campaignSystem && window.campaignSystem.getState ? window.campaignSystem.getState() : null;
      var shared = st && st.campaign && st.campaign.shared && st.campaign.shared.state ? st.campaign.shared.state : {};
      return Number(shared.renown || 0) >= 2;
    },
    null,
    { timeout: STEP_TIMEOUT_MS }
  );

  const resyncAck = await p1Page.evaluate(async () => {
    const before = Date.now();
    await window.campaignSystem.requestResync();
    const st = window.campaignSystem.getState();
    return {
      code: st && st.code,
      tookMs: Date.now() - before
    };
  });
  if (!resyncAck || !resyncAck.code) {
    throw new Error(`Player requestResync failed: ${JSON.stringify(resyncAck)}`);
  }

  const snapshotInfo = await gmPage.evaluate(async () => {
    const st = window.campaignSystem.getState();
    if (!st || !st.code || !st.token || typeof window.io !== "function") {
      return { ok: false, error: "Missing GM state/socket." };
    }
    return await new Promise((resolve) => {
      const s = window.io({ transports: ["websocket", "polling"] });
      const done = (payload) => {
        try { s.disconnect(); } catch (_err) {}
        resolve(payload || { ok: false, error: "No response" });
      };
      s.on("connect_error", (err) => done({ ok: false, error: String(err && err.message ? err.message : err) }));
      s.on("connect", () => {
        s.emit("campaign:join", {
          code: st.code,
          token: st.token,
          role: "gm",
          name: "Scenario GM"
        }, (joinAck) => {
          if (!joinAck || !joinAck.ok) {
            done({ ok: false, error: (joinAck && joinAck.error) || "join failed" });
            return;
          }
          s.emit("campaign:exportSnapshot", {}, (exportAck) => {
            if (!exportAck || !exportAck.ok || !exportAck.snapshot) {
              done({ ok: false, error: (exportAck && exportAck.error) || "export failed" });
              return;
            }
            s.emit("campaign:importSnapshot", { snapshot: exportAck.snapshot }, (importAck) => {
              done({ ok: !!(importAck && importAck.ok), exportOk: true, importAck });
            });
          });
        });
      });
      setTimeout(() => done({ ok: false, error: "snapshot socket timed out" }), 12000);
    });
  });

  if (!snapshotInfo || !snapshotInfo.ok) {
    throw new Error(`Snapshot export/import assertion failed: ${JSON.stringify(snapshotInfo)}`);
  }

  const p1Faction = await p1Page.evaluate(() => {
    var st = window.campaignSystem && window.campaignSystem.getState ? window.campaignSystem.getState() : null;
    var shared = st && st.campaign && st.campaign.shared && st.campaign.shared.state ? st.campaign.shared.state : {};
    var renownMap = shared && shared.factionRenown && typeof shared.factionRenown === "object" ? shared.factionRenown : {};
    var tasks = Array.isArray(shared && shared.factionWayfarerTasks) ? shared.factionWayfarerTasks : [];
    return {
      renownKeys: Object.keys(renownMap).length,
      taskCount: tasks.length
    };
  });
  if (Number(p1Faction.renownKeys || 0) < 1 || Number(p1Faction.taskCount || 0) < 1) {
    throw new Error(`Faction contract sync assertion failed: ${JSON.stringify(p1Faction)}`);
  }

  process.stdout.write(`Campaign scenario passed: code=${code}, requestResyncMs=${resyncAck.tookMs}\n`);

  await gmPage.close();
  await p1Page.close();
  await p2Page.close();
}

async function run() {
  const server = startServer();
  let browser;

  try {
    await waitForServer(BASE_URL, START_TIMEOUT_MS);
    browser = await chromium.launch({ headless: true });
    await runScenario(browser);
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
