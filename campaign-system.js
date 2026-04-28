// campaign-system.js — Multiplayer campaign rooms with session restore and dock UI
(function () {
  var SESSION_KEY = "beyond-light-campaign-session";

  var state = {
    socket: null,
    connected: false,
    ready: false,
    code: "",
    role: "",
    token: "",
    playerName: "",
    campaign: null,
    suppressTmwEmit: false,
    lastKnownTmw: null,
    activePromptId: "",
    autoRestoreTried: false,
    restoringSession: false,
    dockOpen: true,
    lastDockLogSize: 0,
    timelineFilter: "all",
    lastCharacterHash: "",
    gmIdea: "",
    gmWayfarerSort: "online",
    lastSharedHash: "",
    lastSharedVersion: 0,
    applyingSharedState: false,
    uiDraft: {
      name: "",
      code: "",
      joinPassword: ""
    }
  };

  function safeNotif(msg, kind) {
    if (typeof window.showNotif === "function") {
      window.showNotif(msg, kind || "");
    }
  }

  function canUseSockets() {
    return typeof window.io === "function";
  }

  function ensureName() {
    if (state.playerName) return state.playerName;
    var fromS = (typeof window.S !== "undefined" && window.S && window.S.name) ? String(window.S.name).trim() : "";
    state.playerName = fromS || "Wayfarer";
    return state.playerName;
  }

  function emitWithAck(eventName, payload) {
    return new Promise(function (resolve) {
      if (!state.socket) {
        resolve({ ok: false, error: "Not connected to server." });
        return;
      }
      state.socket.emit(eventName, payload || {}, function (res) {
        resolve(res || { ok: false, error: "No response from server." });
      });
    });
  }

  function formatCode(code) {
    return String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  }

  function formatTimestamp(value) {
    var t = Number(value || 0);
    if (!t) return "";
    try {
      return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (_err) {
      return "";
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function deepCloneJson(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_err) {
      return null;
    }
  }

  function getCampaignSharedState() {
    return state.campaign && state.campaign.shared && state.campaign.shared.state && typeof state.campaign.shared.state === "object"
      ? state.campaign.shared.state
      : {};
  }

  function normalizeBackpackItems(items) {
    if (!Array.isArray(items)) return [];
    return items.map(function (entry) { return String(entry || "").trim(); }).filter(Boolean).slice(0, 20);
  }

  function addItemToBackpack(itemName) {
    if (typeof window.S === "undefined" || !window.S) return false;
    var item = String(itemName || "").trim();
    if (!item) return false;
    if (!Array.isArray(window.S.backpack)) {
      window.S.backpack = Array(10).fill("");
    }
    var slot = window.S.backpack.indexOf("");
    if (slot < 0) {
      return false;
    }
    window.S.backpack[slot] = item;
    if (typeof window.renderBackpackUI === "function") {
      window.renderBackpackUI();
    }
    return true;
  }

  function collectSharedState() {
    if (typeof window.S === "undefined" || !window.S) return {};
    var current = getCampaignSharedState();
    var shared = {
      credits: Math.max(0, Number(window.S.credits || 0)),
      renown: Math.max(0, Number(window.S.renown || 0)),
      missionTokens: deepCloneJson(window.S.missionTokens || {}),
      storyline: deepCloneJson(window.S.storyline || {}),
      holding: deepCloneJson(window.S.holding || {}),
      lastSea: deepCloneJson(window.S.lastSea || {}),
      gameDate: deepCloneJson(window.S.gameDate || {}),
      partyStash: Array.isArray(current.partyStash) ? current.partyStash.slice() : []
    };
    if (typeof window.getProvinceMapState === "function") {
      shared.provinceMap = deepCloneJson(window.getProvinceMapState() || null);
    }
    return shared;
  }

  function applySharedState(sharedState, sharedVersion) {
    if (!sharedState || typeof sharedState !== "object") return;
    var nextVersion = Math.max(0, Number(sharedVersion || 0) || 0);
    if (nextVersion && nextVersion < state.lastSharedVersion) return;
    if (typeof window.S === "undefined" || !window.S) return;

    state.applyingSharedState = true;
    try {
      if (typeof sharedState.credits === "number") {
        window.S.credits = Math.max(0, Number(sharedState.credits || 0));
      }
      if (typeof sharedState.renown === "number") {
        window.S.renown = Math.max(0, Number(sharedState.renown || 0));
      }
      if (sharedState.storyline && typeof sharedState.storyline === "object") {
        window.S.storyline = deepCloneJson(sharedState.storyline) || {};
      }
      if (sharedState.missionTokens && typeof sharedState.missionTokens === "object") {
        window.S.missionTokens = deepCloneJson(sharedState.missionTokens) || {};
      }
      if (sharedState.holding && typeof sharedState.holding === "object") {
        window.S.holding = deepCloneJson(sharedState.holding) || {};
      }
      if (sharedState.lastSea && typeof sharedState.lastSea === "object") {
        window.S.lastSea = deepCloneJson(sharedState.lastSea) || {};
      }
      if (sharedState.gameDate && typeof sharedState.gameDate === "object") {
        window.S.gameDate = deepCloneJson(sharedState.gameDate) || {};
      }
      if (sharedState.provinceMap && typeof window.applyProvinceMapState === "function") {
        window.applyProvinceMapState(sharedState.provinceMap, { skipSync: true });
      }
    } finally {
      state.applyingSharedState = false;
    }

    if (typeof window.updateCreditsUI === "function") window.updateCreditsUI();
    if (typeof window.updateRenown === "function") window.updateRenown();
    if (typeof window.renderLastSeaMap === "function") window.renderLastSeaMap();
    if (typeof window.renderLastSeaInfo === "function") window.renderLastSeaInfo();
    if (typeof window.renderHexMap === "function") window.renderHexMap();

    state.lastSharedVersion = nextVersion || state.lastSharedVersion;
    state.lastSharedHash = JSON.stringify(sharedState);
  }

  async function syncSharedState(reason) {
    if (!state.socket || !state.connected || !state.code) return;
    if (state.applyingSharedState) return;
    var shared = collectSharedState();
    var hash = JSON.stringify(shared);
    if (!hash || hash === state.lastSharedHash) return;
    var res = await emitWithAck("campaign:syncState", { state: shared, reason: reason || "auto" });
    if (res && res.ok) {
      state.lastSharedHash = hash;
      state.lastSharedVersion = Math.max(state.lastSharedVersion, Number(res.stateVersion || 0));
    }
  }

  async function syncSharedNow() {
    if (!state.socket || !state.connected || !state.code) {
      safeNotif("Join a campaign first.", "warn");
      return;
    }
    var shared = collectSharedState();
    var res = await pushSharedState(shared, "manual");
    if (!res || !res.ok) {
      safeNotif((res && res.error) || "Shared world sync failed.", "warn");
      return;
    }
    safeNotif("Shared world synced (v" + Number(res.stateVersion || 0) + ").", "good");
  }

  async function pushSharedState(nextState, reason) {
    if (!state.socket || !state.connected || !state.code) {
      safeNotif("Join a campaign first.", "warn");
      return { ok: false };
    }
    var res = await emitWithAck("campaign:syncState", { state: nextState || {}, reason: reason || "manual" });
    if (res && res.ok) {
      state.lastSharedHash = JSON.stringify(nextState || {});
      state.lastSharedVersion = Math.max(state.lastSharedVersion, Number(res.stateVersion || 0));
    }
    return res || { ok: false, error: "No response." };
  }

  function loadSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return {
        code: formatCode(parsed.code || ""),
        token: String(parsed.token || "").trim(),
        name: String(parsed.name || "").trim().slice(0, 32),
        role: parsed.role === "gm" ? "gm" : "player"
      };
    } catch (_err) {
      return null;
    }
  }

  function persistSession() {
    if (!state.code || !state.token) return;
    var payload = {
      code: state.code,
      token: state.token,
      name: state.playerName || ensureName(),
      role: state.role === "gm" ? "gm" : "player"
    };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch (_err) {}
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (_err) {}
  }

  function getTmwValue() {
    if (typeof window.S === "undefined" || !window.S) return 0;
    return Math.max(0, Number(window.S.tmw || 0));
  }

  function setLocalTmw(value) {
    if (typeof window.S === "undefined" || !window.S) return;
    state.suppressTmwEmit = true;
    window.S.tmw = Math.max(0, Number(value || 0));
    if (typeof window.updateTMWPool === "function") {
      window.updateTMWPool();
    }
    state.lastKnownTmw = window.S.tmw;
    setTimeout(function () { state.suppressTmwEmit = false; }, 0);
  }

  async function syncCurrentTmw(reason) {
    if (!state.connected || !state.code) return;
    if (state.suppressTmwEmit) return;
    var tmw = getTmwValue();
    if (state.lastKnownTmw === tmw) return;
    state.lastKnownTmw = tmw;
    await emitWithAck("campaign:setTmw", { value: tmw, reason: reason || "sync" });
  }

  function patchTmwHooks() {
    if (window._campaignPatchedTmwHooks) return;
    if (typeof window.updateTMWPool !== "function") return;

    var originalUpdate = window.updateTMWPool;
    window.updateTMWPool = function () {
      var before = getTmwValue();
      var result = originalUpdate.apply(this, arguments);
      var after = getTmwValue();
      if (before !== after || state.lastKnownTmw !== after) {
        syncCurrentTmw("updateTMWPool");
      }
      return result;
    };

    if (typeof window.changeCounter === "function") {
      var originalCounter = window.changeCounter;
      window.changeCounter = function (key, delta) {
        var result = originalCounter.apply(this, arguments);
        if (key === "tmw") {
          syncCurrentTmw("changeCounter");
        }
        return result;
      };
    }

    window._campaignPatchedTmwHooks = true;
  }

  function renderMembers(list) {
    if (!Array.isArray(list) || !list.length) {
      return '<div class="campaign-muted">No connected members.</div>';
    }
    return list.map(function (m) {
      var roleTag = m.role === "gm" ? "<span class=\"campaign-pill gm\">GM</span>" : "<span class=\"campaign-pill\">Player</span>";
      return '<div class="campaign-member-row"><span>' + escapeHtml(m.name || "Player") + '</span>' + roleTag + "</div>";
    }).join("");
  }

  function renderCharacterRoster(list) {
    if (!Array.isArray(list) || !list.length) {
      return '<div class="campaign-muted">No campaign wayfarers yet.</div>';
    }
    var items = list.slice();
    if (state.gmWayfarerSort === "updated") {
      items.sort(function (a, b) {
        var au = a && a.character && a.character.updatedAt ? Number(a.character.updatedAt) : Number(a && a.lastSeenAt || 0);
        var bu = b && b.character && b.character.updatedAt ? Number(b.character.updatedAt) : Number(b && b.lastSeenAt || 0);
        return bu - au;
      });
    } else {
      items.sort(function (a, b) {
        var ao = a && a.online ? 1 : 0;
        var bo = b && b.online ? 1 : 0;
        if (ao !== bo) return bo - ao;
        var au = a && a.character && a.character.updatedAt ? Number(a.character.updatedAt) : Number(a && a.lastSeenAt || 0);
        var bu = b && b.character && b.character.updatedAt ? Number(b.character.updatedAt) : Number(b && b.lastSeenAt || 0);
        return bu - au;
      });
    }

    return items.map(function (p) {
      var c = p && p.character ? p.character : null;
      var nm = c && c.name ? c.name : (p && p.name ? p.name : "Wayfarer");
      var hp = c && typeof c.health === "number" ? c.health : 0;
      var backpackItems = c && Array.isArray(c.backpack) ? normalizeBackpackItems(c.backpack) : [];
      var look = c && c.look ? String(c.look).slice(0, 120) : "No look set";
      var updatedAt = c && c.updatedAt ? Number(c.updatedAt) : Number(p && p.lastSeenAt || 0);
      var initials = String(nm || "W").trim().split(/\s+/).slice(0, 2).map(function (part) {
        return part ? part.charAt(0).toUpperCase() : "";
      }).join("") || "W";
      var lookTags = [];
      if (look && look !== "No look set") {
        String(look).split(/\s+/).forEach(function (word) {
          var cleaned = String(word || "").replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
          if (!cleaned || cleaned.length < 4) return;
          if (lookTags.indexOf(cleaned) === -1) lookTags.push(cleaned);
        });
      }
      var tagsHtml = lookTags.slice(0, 3).map(function (tag) {
        return '<span class="campaign-look-tag">' + escapeHtml(tag) + '</span>';
      }).join("");
      var roleText = (p && p.role === "gm") ? "GM" : "Player";
      var onlineText = p && p.online ? "Online" : "Offline";
      return ''
        + '<div class="campaign-wayfarer-row">'
        + '<div class="campaign-wayfarer-main">'
        + '<div class="campaign-portrait">' + escapeHtml(initials) + '</div>'
        + '<div class="campaign-wayfarer-info">'
        + '<div><strong>' + escapeHtml(nm) + '</strong> <span class="campaign-muted">HP ' + Number(hp) + '</span></div>'
        + '<div class="campaign-look-tags">' + (backpackItems.length
          ? backpackItems.slice(0, 3).map(function (item, idx) {
              var tokenValue = String(p && p.token || "").replace(/'/g, "\\'");
              return '<button class="btn btn-xs" style="margin:0 .2rem .2rem 0;" onclick="window.campaignSystem.copyRosterItem(\'' + tokenValue + '\',' + idx + ')">Copy ' + escapeHtml(item) + '</button>';
            }).join("")
          : '<span class="campaign-look-tag">no shared items</span>') + '</div>'
        + '<div class="campaign-look-tags">' + (tagsHtml || '<span class="campaign-look-tag">untyped</span>') + '</div>'
        + '<div class="campaign-muted">' + escapeHtml(look) + '</div>'
        + '<div class="campaign-muted">Updated ' + escapeHtml(formatTimestamp(updatedAt) || "-") + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="campaign-wayfarer-pills">'
        + '<span class="campaign-pill ' + ((p && p.role === "gm") ? 'gm' : '') + '">' + escapeHtml(roleText) + '</span>'
        + '<span class="campaign-pill ' + ((p && p.online) ? 'online' : '') + '">' + escapeHtml(onlineText) + '</span>'
        + '</div>'
        + '</div>';
    }).join("");
  }

  function setWayfarerSort(mode) {
    var next = String(mode || "online");
    if (["online", "updated"].indexOf(next) === -1) next = "online";
    state.gmWayfarerSort = next;
    renderSettingsSection();
  }

  function collectCharacterSummary() {
    var stats = (typeof window.S !== "undefined" && window.S && window.S.stats) ? window.S.stats : {};
    var hp = (typeof window.S !== "undefined" && window.S)
      ? ((typeof window.S.health === "number") ? window.S.health : 0)
      : 0;
    var look = (typeof window.S !== "undefined" && window.S)
      ? (window.S.look || window.S.flavor || window.S.reason || "")
      : "";
    return {
      name: ensureName(),
      health: Math.max(0, Number(hp || 0)),
      stress: Math.max(0, Number((window.S && window.S.stress) || 0)),
      look: String(look || "").slice(0, 180),
      stats: {
        body: Number(stats.body || 4),
        mind: Number(stats.mind || 4),
        spirit: Number(stats.spirit || 4),
        control: Number(stats.control || 4),
        lead: Number(stats.lead || 4),
        adventure: Number(stats.adventure || 4)
      },
      backpack: normalizeBackpackItems(window.S && window.S.backpack)
    };
  }

  async function shareBackpackItem(slotIndex) {
    if (typeof window.S === "undefined" || !window.S) return;
    if (!Array.isArray(window.S.backpack)) {
      safeNotif("No backpack items to share.", "warn");
      return;
    }
    var idx = Math.max(0, Number(slotIndex || 0));
    var item = String(window.S.backpack[idx] || "").trim();
    if (!item) {
      safeNotif("That backpack slot is empty.", "warn");
      return;
    }
    var next = collectSharedState();
    if (!Array.isArray(next.partyStash)) next.partyStash = [];
    next.partyStash.push(item);
    window.S.backpack[idx] = "";
    if (typeof window.renderBackpackUI === "function") window.renderBackpackUI();
    var res = await pushSharedState(next, "share-item");
    if (!res.ok) {
      window.S.backpack[idx] = item;
      if (typeof window.renderBackpackUI === "function") window.renderBackpackUI();
      safeNotif(res.error || "Could not share item.", "warn");
      return;
    }
    safeNotif("Shared item to party stash: " + item, "good");
  }

  async function claimSharedItem(stashIndex) {
    var shared = getCampaignSharedState();
    var list = Array.isArray(shared.partyStash) ? shared.partyStash.slice() : [];
    var idx = Math.max(0, Number(stashIndex || 0));
    var item = String(list[idx] || "").trim();
    if (!item) {
      safeNotif("That party stash item is no longer available.", "warn");
      return;
    }
    if (!addItemToBackpack(item)) {
      safeNotif("Backpack full.", "warn");
      return;
    }
    list.splice(idx, 1);
    var next = collectSharedState();
    next.partyStash = list;
    var res = await pushSharedState(next, "claim-item");
    if (!res.ok) {
      safeNotif(res.error || "Could not claim party item.", "warn");
      return;
    }
    safeNotif("Claimed from party stash: " + item, "good");
  }

  function copyRosterItem(token, itemIndex) {
    var roster = state.campaign && Array.isArray(state.campaign.roster) ? state.campaign.roster : [];
    var target = roster.find(function (member) { return String(member.token || "") === String(token || ""); });
    var item = target && target.character && Array.isArray(target.character.backpack)
      ? String(target.character.backpack[Math.max(0, Number(itemIndex || 0))] || "").trim()
      : "";
    if (!item) {
      safeNotif("Item is no longer available on that wayfarer.", "warn");
      return;
    }
    if (!addItemToBackpack(item)) {
      safeNotif("Backpack full.", "warn");
      return;
    }
    safeNotif("Shared from wayfarer sheet: " + item, "good");
  }

  async function syncCharacterToCampaign(force) {
    if (!state.socket || !state.connected || !state.code) return;
    var summary = collectCharacterSummary();
    var hash = JSON.stringify(summary);
    if (!force && hash === state.lastCharacterHash) return;
    var res = await emitWithAck("campaign:updateCharacter", { character: summary });
    if (res && res.ok) {
      state.lastCharacterHash = hash;
    }
  }

  function generateWayfarerIdea() {
    var first = ["Rhea", "Kade", "Nira", "Sable", "Tarin", "Mira", "Voss", "Ena", "Jax", "Pell"];
    var last = ["Drift", "Blackwire", "Vale", "Meridian", "Ash", "Quill", "Rune", "Dune"];
    var looks = [
      "scarred pilot coat and bright lens visor",
      "salt-cured cloak with brass breathing mask",
      "patched synth-leathers and copper braids",
      "ceramic half-mask with weathered naval tattoos"
    ];
    var drives = [
      "recover a vanished convoy logbook",
      "pay off a family debt to dock syndicates",
      "map safe lanes through cyclone season",
      "hunt raiders who burned their first ship"
    ];
    var name = first[Math.floor(Math.random() * first.length)] + " " + last[Math.floor(Math.random() * last.length)];
    var look = looks[Math.floor(Math.random() * looks.length)];
    var drive = drives[Math.floor(Math.random() * drives.length)];
    state.gmIdea = name + " - " + look + ". Drive: " + drive + ".";
    renderSettingsSection();
  }

  function renderLog(log, limit) {
    if (!Array.isArray(log) || !log.length) {
      return '<div class="campaign-muted">No events yet.</div>';
    }
    return log.slice(-(limit || 8)).reverse().map(function (entry) {
      var kind = escapeHtml(entry.kind || "system");
      var text = escapeHtml(entry.text || "");
      return '<div class="campaign-log-row"><span class="campaign-log-kind">' + kind + '</span><span>' + text + "</span></div>";
    }).join("");
  }

  function renderDockTimeline(log) {
    if (!Array.isArray(log) || !log.length) {
      return '<div class="campaign-dock-empty">No timeline yet.</div>';
    }
    return log.slice(-40).map(function (entry) {
      var kind = String(entry.kind || "system");
      var text = escapeHtml(entry.text || "");
      var ts = formatTimestamp(entry.at);
      var rowClass = "campaign-dock-line";
      if (kind === "chat") rowClass += " chat";
      if (kind === "roll" || kind === "roll-result") rowClass += " roll";
      return ''
        + '<div class="' + rowClass + '">'
        + '<span class="campaign-dock-kind">' + escapeHtml(kind) + '</span>'
        + '<span class="campaign-dock-text">' + text + '</span>'
        + '<span class="campaign-dock-time">' + escapeHtml(ts) + '</span>'
        + "</div>";
    }).join("");
  }

  function filterTimeline(log) {
    var source = Array.isArray(log) ? log : [];
    if (state.role !== "gm") return source;
    var mode = String(state.timelineFilter || "all");
    if (mode === "all") return source;
    if (mode === "chat") {
      return source.filter(function (entry) { return String(entry && entry.kind || "") === "chat"; });
    }
    if (mode === "roll") {
      return source.filter(function (entry) {
        var k = String(entry && entry.kind || "");
        return k === "roll" || k === "roll-result";
      });
    }
    if (mode === "system") {
      return source.filter(function (entry) {
        var k = String(entry && entry.kind || "");
        return k === "system" || k === "tmw" || k === "note";
      });
    }
    return source;
  }

  function ensureSettingsSection() {
    var panel = document.getElementById("settingsPanel");
    if (!panel) return;
    var popup = panel.querySelector(".settings-popup");
    if (!popup) return;

    var existing = document.getElementById("campaignSettingsSection");
    if (!existing) {
      var section = document.createElement("div");
      section.id = "campaignSettingsSection";
      section.className = "settings-section";
      var footer = popup.querySelector(".settings-footer");
      if (footer) popup.insertBefore(section, footer);
      else popup.appendChild(section);
      renderSettingsSection();
      return;
    }
  }

  function captureDraftInputs() {
    var nameEl = document.getElementById("campaignNameInput");
    var codeEl = document.getElementById("campaignCodeInput");
    var passEl = document.getElementById("campaignPasswordInput");
    if (nameEl) state.uiDraft.name = String(nameEl.value || "");
    if (codeEl) state.uiDraft.code = String(codeEl.value || "");
    if (passEl) state.uiDraft.joinPassword = String(passEl.value || "");
  }

  function bindDraftInputs() {
    ["campaignNameInput", "campaignCodeInput", "campaignPasswordInput"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.dataset.campaignDraftBound === "1") return;
      el.dataset.campaignDraftBound = "1";
      el.addEventListener("input", function () {
        if (id === "campaignNameInput") state.uiDraft.name = String(el.value || "");
        if (id === "campaignCodeInput") state.uiDraft.code = String(el.value || "");
        if (id === "campaignPasswordInput") state.uiDraft.joinPassword = String(el.value || "");
      });
    });
  }

  function renderSettingsSection() {
    var section = document.getElementById("campaignSettingsSection");
    if (!section) return;

    captureDraftInputs();

    var ioReady = canUseSockets();
    var campaign = state.campaign;
    var sharedState = getCampaignSharedState();
    var sharedTmw = campaign && campaign.shared ? Number(campaign.shared.tmw || 0) : getTmwValue();
    var sharedCredits = Math.max(0, Number(sharedState.credits != null ? sharedState.credits : ((window.S && window.S.credits) || 0)));
    var sharedRenown = Math.max(0, Number(sharedState.renown != null ? sharedState.renown : ((window.S && window.S.renown) || 0)));
    var partyStash = Array.isArray(sharedState.partyStash) ? sharedState.partyStash : [];
    var localBackpackSlots = Array.isArray(window.S && window.S.backpack)
      ? window.S.backpack.map(function (item, idx) {
          return { item: String(item || "").trim(), idx: idx };
        }).filter(function (entry) { return !!entry.item; })
      : [];
    var isGm = state.role === "gm";
    var active = campaign && campaign.activeRollRequest;
    var privateNote = campaign && campaign.me ? String(campaign.me.privateNote || "") : "";
    var nameValue = state.uiDraft.name || state.playerName || ensureName();
    var codeValue = state.uiDraft.code || state.code || "";
    var joinPasswordValue = state.uiDraft.joinPassword || "";
    var noteSummaries = campaign && Array.isArray(campaign.notesSummary) ? campaign.notesSummary : [];
    var roster = campaign && Array.isArray(campaign.roster) ? campaign.roster : [];
    var summaryHtml = isGm && noteSummaries.length
      ? ('<div class="campaign-muted" style="margin-top:.35rem;">' + noteSummaries.map(function (n) {
          var stamp = n.updatedAt ? (" @ " + formatTimestamp(n.updatedAt)) : "";
          return escapeHtml(n.name + (n.hasNote ? stamp : " (no note)"));
        }).join(" · ") + '</div>')
      : '';

    section.innerHTML = ""
      + '<h4>Campaign (Multiplayer)</h4>'
      + '<div class="campaign-status-row">'
      + '<span class="campaign-badge ' + (state.connected ? "online" : "offline") + '">' + (state.connected ? "Online" : (ioReady ? "Offline" : "Server Script Missing")) + "</span>"
      + '<span class="campaign-muted">Code: <strong style="color:var(--teal);">' + escapeHtml(state.code || "-") + "</strong></span>"
      + "</div>"
      + '<div class="setting-row">'
      + '<label>Display Name</label>'
      + '<input id="campaignNameInput" class="campaign-input" type="text" maxlength="32" value="' + escapeHtml(nameValue) + '" placeholder="Wayfarer Name">'
      + "</div>"
      + '<div class="setting-row">'
      + '<label>Campaign Code</label>'
      + '<input id="campaignCodeInput" class="campaign-input" type="text" maxlength="12" placeholder="ABC123" value="' + escapeHtml(codeValue) + '">' 
      + "</div>"
      + '<div class="setting-row">'
      + '<label>Join Password (Optional)</label>'
      + '<input id="campaignPasswordInput" class="campaign-input" type="password" maxlength="120" placeholder="Campaign password if set" value="' + escapeHtml(joinPasswordValue) + '">'
      + "</div>"
      + '<div class="campaign-actions">'
      + '<button class="btn btn-xs btn-teal" onclick="window.campaignSystem.createCampaign()">Create (GM)</button>'
      + '<button class="btn btn-xs" onclick="window.campaignSystem.joinCampaign(\'player\')">Join Player</button>'
      + '<button class="btn btn-xs" onclick="window.campaignSystem.joinCampaign(\'gm\')">Join GM</button>'
      + '<button class="btn btn-xs btn-red" onclick="window.campaignSystem.leaveCampaign()">Leave</button>'
      + "</div>"
      + '<div class="campaign-card">'
      + '<div class="campaign-card-title">Shared Teamwork Points</div>'
      + '<div class="campaign-tmw">' + sharedTmw + "</div>"
      + '<div class="campaign-muted" style="margin-top:.2rem;">Coin <strong style="color:var(--gold2);">' + sharedCredits + '₵</strong> · Renown <strong style="color:var(--teal);">' + sharedRenown + '</strong></div>'
      + '<div class="campaign-actions" style="margin-top:.35rem;">'
      + '<button class="btn btn-xs btn-teal" onclick="window.campaignSystem.syncSharedNow()">Sync Shared World</button>'
      + '</div>'
      + '<div class="campaign-muted">'
      + 'Persistent state enabled'
      + (campaign && campaign.archived ? ' · <strong style="color:var(--gold2);">Archived</strong>' : '')
      + (campaign && campaign.hasPassword ? ' · Password Protected' : '')
      + '</div>'
      + "</div>"
      + (isGm
        ? (""
          + '<div class="campaign-card">'
          + '<div class="campaign-card-title">GM Roll Call</div>'
          + '<div class="campaign-roll-grid">'
          + '<input id="campaignRollLabel" class="campaign-input" type="text" maxlength="80" placeholder="Dread Check" value="Dread Check">'
          + '<input id="campaignRollStat" class="campaign-input" type="text" maxlength="32" placeholder="adventure" value="adventure">'
          + '<input id="campaignRollDread" class="campaign-input" type="number" min="1" max="20" value="8">'
          + "</div>"
          + '<div class="campaign-actions" style="margin-top:.35rem;">'
          + '<button class="btn btn-xs btn-teal" onclick="window.campaignSystem.callRollRequest()">Call Roll</button>'
          + '<button class="btn btn-xs" onclick="window.campaignSystem.closeActiveRoll()">Close Active</button>'
          + "</div>"
          + (active ? ('<div class="campaign-muted" style="margin-top:.35rem;">Active: ' + escapeHtml(active.label) + ' · ' + escapeHtml(active.stat) + ' vs d' + Number(active.dread || 8) + '</div>') : '<div class="campaign-muted" style="margin-top:.35rem;">No active roll request.</div>')
          + "</div>")
        : "")
      + (isGm
        ? (""
          + '<div class="campaign-card">'
          + '<div class="campaign-card-title">GM Campaign Controls</div>'
          + '<div class="campaign-roll-grid">'
          + '<input id="campaignSetPasswordInput" class="campaign-input" type="password" maxlength="120" placeholder="Set/replace password (blank to remove)">'
          + "</div>"
          + '<div class="campaign-actions" style="margin-top:.35rem;">'
          + '<button class="btn btn-xs" onclick="window.campaignSystem.setCampaignPassword()">Apply Password</button>'
          + '<button class="btn btn-xs" onclick="window.campaignSystem.toggleArchive()">' + ((campaign && campaign.archived) ? 'Reopen' : 'Archive') + '</button>'
          + '<button class="btn btn-xs btn-red" onclick="window.campaignSystem.deleteCampaign()">Delete Campaign</button>'
          + "</div>"
          + '</div>')
        : "")
      + '<div class="campaign-card">'
      + '<div class="campaign-card-title">Online Members</div>'
      + renderMembers(campaign ? campaign.members : [])
      + "</div>"
      + '<div class="campaign-card">'
      + '<div class="campaign-card-title">Campaign Wayfarers</div>'
      + '<div class="campaign-actions campaign-sort-actions">'
      + '<button class="btn btn-xs ' + (state.gmWayfarerSort === 'online' ? 'btn-teal' : '') + '" onclick="window.campaignSystem.setWayfarerSort(\'online\')">Online First</button>'
      + '<button class="btn btn-xs ' + (state.gmWayfarerSort === 'updated' ? 'btn-teal' : '') + '" onclick="window.campaignSystem.setWayfarerSort(\'updated\')">Last Updated</button>'
      + '</div>'
      + renderCharacterRoster(roster)
      + '</div>'
      + (isGm
        ? (""
          + '<div class="campaign-card">'
          + '<div class="campaign-card-title">GM Wayfarer Generator</div>'
          + '<div class="campaign-muted">Generate quick NPC/PC ideas for campaign prep.</div>'
          + '<div class="campaign-actions" style="margin-top:.35rem;">'
          + '<button class="btn btn-xs btn-teal" onclick="window.campaignSystem.generateWayfarerIdea()">Generate Idea</button>'
          + '</div>'
          + (state.gmIdea ? ('<div class="campaign-muted" style="margin-top:.35rem;color:var(--text2);">' + escapeHtml(state.gmIdea) + '</div>') : '')
          + '</div>')
        : "")
      + '<div class="campaign-card">'
      + '<div class="campaign-card-title">Party Backpack Sharing (Party Stash)</div>'
      + '<div class="campaign-muted">Share items from your backpack to a shared pool, then claim them on any wayfarer. Roster buttons copy visible items into your backpack first.</div>'
        + '<div class="campaign-muted" style="margin-top:.28rem;">Your backpack: ' + (localBackpackSlots.length ? localBackpackSlots.map(function (entry) {
          return '<button class="btn btn-xs" style="margin:0 .2rem .2rem 0;" onclick="window.campaignSystem.shareBackpackItem(' + entry.idx + ')">Share ' + escapeHtml(entry.item) + '</button>';
        }).join('') : 'No items') + '</div>'
      + '<div class="campaign-muted" style="margin-top:.28rem;">Party pool: ' + (partyStash.length ? partyStash.map(function (item, i) {
          return '<button class="btn btn-xs btn-teal" style="margin:0 .2rem .2rem 0;" onclick="window.campaignSystem.claimSharedItem(' + i + ')">Take ' + escapeHtml(item) + '</button>';
        }).join('') : 'No shared items yet') + '</div>'
      + '</div>'
      + '<div class="campaign-card">'
      + '<div class="campaign-card-title">Private Notes</div>'
      + '<textarea id="campaignPrivateNoteInput" class="campaign-input" maxlength="5000" placeholder="Your private campaign notes...">' + escapeHtml(privateNote) + '</textarea>'
      + '<div class="campaign-actions" style="margin-top:.35rem;">'
      + '<button class="btn btn-xs btn-teal" onclick="window.campaignSystem.savePrivateNote()">Save Notes</button>'
      + '</div>'
      + summaryHtml
      + "</div>"
      + '<div class="campaign-card">'
      + '<div class="campaign-card-title">Recent Log</div>'
      + renderLog(campaign ? campaign.log : [])
      + "</div>";

    bindDraftInputs();
  }

  function ensureDockPanel() {
    if (document.getElementById("campaignDock")) return;

    var dock = document.createElement("div");
    dock.id = "campaignDock";
    dock.className = "campaign-dock";

    dock.innerHTML = ""
      + '<button id="campaignDockToggle" class="campaign-dock-toggle" onclick="window.campaignSystem.toggleDock()">Campaign</button>'
      + '<div id="campaignDockPanel" class="campaign-dock-panel">'
      + '<div class="campaign-dock-head">'
      + '<div class="campaign-dock-title">Campaign Live</div>'
      + '<div id="campaignDockBadge" class="campaign-dock-badge offline">Offline</div>'
      + "</div>"
      + '<div id="campaignDockMeta" class="campaign-dock-meta">No campaign connected.</div>'
      + '<div id="campaignDockRoll" class="campaign-dock-roll"></div>'
      + '<div id="campaignDockFilters" class="campaign-dock-filters"></div>'
      + '<div id="campaignDockTimeline" class="campaign-dock-timeline"></div>'
      + '<div class="campaign-dock-chat">'
      + '<input id="campaignDockChatInput" class="campaign-dock-input" type="text" maxlength="500" placeholder="Type campaign chat...">'
      + '<button class="btn btn-xs btn-teal" onclick="window.campaignSystem.sendChatMessage()">Send</button>'
      + "</div>"
      + "</div>";

    document.body.appendChild(dock);

    var input = document.getElementById("campaignDockChatInput");
    if (input) {
      input.addEventListener("keydown", function (evt) {
        if (evt.key === "Enter") {
          evt.preventDefault();
          sendChatMessage();
        }
      });
    }

    renderDockPanel();
  }

  function renderDockPanel() {
    var root = document.getElementById("campaignDock");
    if (!root) return;
    root.classList.toggle("open", !!state.dockOpen);
    syncDockOffset(root);

    var badge = document.getElementById("campaignDockBadge");
    var meta = document.getElementById("campaignDockMeta");
    var timeline = document.getElementById("campaignDockTimeline");
    var roll = document.getElementById("campaignDockRoll");
    var filters = document.getElementById("campaignDockFilters");

    if (badge) {
      badge.textContent = state.connected ? "Online" : "Offline";
      badge.className = "campaign-dock-badge " + (state.connected ? "online" : "offline");
    }

    var campaign = state.campaign;
    var active = campaign && campaign.activeRollRequest;

    if (meta) {
      var roleLabel = state.role === "gm" ? "GM" : (state.role ? "Player" : "-");
      meta.innerHTML = ""
        + '<span>Code <strong>' + escapeHtml(state.code || "-") + "</strong></span>"
        + '<span>Role <strong>' + escapeHtml(roleLabel) + "</strong></span>"
        + '<span>TMW <strong>' + String(campaign && campaign.shared ? Number(campaign.shared.tmw || 0) : getTmwValue()) + "</strong></span>";
    }

    if (roll) {
      if (!active) {
        roll.innerHTML = '<div class="campaign-dock-empty">No active GM roll request.</div>';
      } else {
        var canRoll = state.role !== "gm";
        var responseCount = Array.isArray(active.responses) ? active.responses.length : 0;
        roll.innerHTML = ""
          + '<div class="campaign-dock-roll-line">'
          + '<span><strong>' + escapeHtml(active.label || "Dread Check") + '</strong> · ' + escapeHtml(String(active.stat || "adventure").toUpperCase()) + ' vs d' + Number(active.dread || 8) + '</span>'
          + '<span>' + responseCount + ' response' + (responseCount === 1 ? "" : "s") + '</span>'
          + "</div>"
          + (canRoll
            ? '<div class="campaign-dock-roll-actions"><button class="btn btn-xs btn-teal" onclick="window.campaignSystem.submitActiveRoll()">Roll Now</button></div>'
            : '<div class="campaign-dock-roll-actions"><button class="btn btn-xs" onclick="window.campaignSystem.closeActiveRoll()">Close Active</button></div>');
      }
    }

    if (filters) {
      if (state.role === "gm") {
        var modes = [
          { id: "all", label: "All" },
          { id: "chat", label: "Chat" },
          { id: "roll", label: "Rolls" },
          { id: "system", label: "System" }
        ];
        filters.innerHTML = modes.map(function (m) {
          var on = state.timelineFilter === m.id;
          return '<button class="btn btn-xs ' + (on ? 'btn-teal' : '') + '" onclick="window.campaignSystem.setTimelineFilter(\'' + m.id + '\')">' + m.label + '</button>';
        }).join("");
      } else {
        filters.innerHTML = "";
      }
    }

    if (timeline) {
      var oldScrollBottom = timeline.scrollHeight - timeline.scrollTop - timeline.clientHeight;
      var filtered = filterTimeline(campaign && campaign.log ? campaign.log : []);
      timeline.innerHTML = renderDockTimeline(filtered);
      var newLogSize = campaign && Array.isArray(campaign.log) ? campaign.log.length : 0;
      if (oldScrollBottom < 40 || newLogSize !== state.lastDockLogSize) {
        timeline.scrollTop = timeline.scrollHeight;
      }
      state.lastDockLogSize = newLogSize;
    }
  }

  function syncDockOffset(root) {
    var target = root || document.getElementById("campaignDock");
    if (!target) return;
    var panel = document.getElementById("settingsPanel");
    var settingsOpen = !!(panel && panel.classList.contains("open"));
    target.classList.toggle("settings-open", settingsOpen && window.innerWidth > 700);
  }

  function readUiValue(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || "") : "";
  }

  async function attemptAutoRestore() {
    if (!state.socket || !state.connected || state.autoRestoreTried || state.restoringSession) return;
    state.autoRestoreTried = true;

    var session = loadSession();
    if (!session || !session.code) return;

    state.restoringSession = true;
    var res = await emitWithAck("campaign:join", {
      code: session.code,
      token: session.token,
      name: session.name || ensureName(),
      role: session.role === "gm" ? "gm" : "player"
    });
    state.restoringSession = false;

    if (!res.ok) {
      clearSession();
      safeNotif("Saved campaign session could not be restored.", "warn");
      renderSettingsSection();
      renderDockPanel();
      return;
    }

    state.code = res.code;
    state.role = res.role;
    state.token = String(res.token || "");
    state.playerName = String(res.name || session.name || ensureName());
    state.activePromptId = "";
    persistSession();

    if (window.settingsSystem && typeof window.settingsSystem.setGameMode === "function") {
      window.settingsSystem.setGameMode(res.role === "gm" ? "gm" : "solo");
    }

    safeNotif("Restored campaign " + res.code + " as " + (res.role === "gm" ? "GM" : "Player") + ".", "good");
    renderSettingsSection();
    renderDockPanel();
  }

  function ensureSocket() {
    if (!canUseSockets()) {
      return false;
    }
    if (state.socket) return true;

    state.socket = window.io({ transports: ["websocket", "polling"] });

    state.socket.on("connect", function () {
      state.connected = true;
      renderSettingsSection();
      renderDockPanel();
      attemptAutoRestore();
      syncCharacterToCampaign(true);
    });

    state.socket.on("disconnect", function () {
      state.connected = false;
      renderSettingsSection();
      renderDockPanel();
    });

    state.socket.on("campaign:state", function (snapshot) {
      state.campaign = snapshot || null;
      state.code = snapshot && snapshot.code ? String(snapshot.code) : "";

      if (snapshot && snapshot.me) {
        state.role = snapshot.me.role === "gm" ? "gm" : "player";
        if (snapshot.me.token) {
          state.token = String(snapshot.me.token);
          persistSession();
        }
      }

      var nextTmw = snapshot && snapshot.shared ? Number(snapshot.shared.tmw || 0) : null;
      if (nextTmw !== null && nextTmw !== getTmwValue()) {
        setLocalTmw(nextTmw);
      }
      applySharedState(
        snapshot && snapshot.shared ? snapshot.shared.state : null,
        snapshot && snapshot.shared ? snapshot.shared.stateVersion : 0
      );

      maybePromptActiveRoll(snapshot && snapshot.activeRollRequest ? snapshot.activeRollRequest : null);
      renderSettingsSection();
      renderDockPanel();
      syncCharacterToCampaign(false);
      syncSharedState("snapshot");
    });

    state.socket.on("campaign:notice", function (payload) {
      if (!payload || typeof payload !== "object") return;
      var text = String(payload.text || "").trim();
      if (!text) return;
      var sourceToken = String(payload.sourceToken || "");
      if (sourceToken && state.token && sourceToken === state.token) return;

      var kind = String(payload.kind || "system");
      var tone = "info";
      if (kind === "roll" || kind === "roll-result") tone = "good";
      else if (kind === "tmw") tone = "good";
      else if (kind === "chat") tone = "info";
      else if (kind === "system") tone = "info";

      safeNotif("Campaign: " + text, tone);
    });

    state.socket.on("campaign:deleted", function (payload) {
      var code = payload && payload.code ? String(payload.code) : state.code;
      state.code = "";
      state.role = "";
      state.token = "";
      state.campaign = null;
      state.activePromptId = "";
      state.uiDraft.code = "";
      state.uiDraft.joinPassword = "";
      clearSession();
      safeNotif((code ? ("Campaign " + code + " was deleted by GM.") : "Campaign deleted by GM."), "warn");
      renderSettingsSection();
      renderDockPanel();
    });

    return true;
  }

  function maybePromptActiveRoll(activeRequest) {
    if (!activeRequest || !activeRequest.id) return;
    if (state.role === "gm") return;
    if (state.activePromptId === activeRequest.id) return;
    state.activePromptId = activeRequest.id;

    var stat = String(activeRequest.stat || "adventure");
    var dread = Number(activeRequest.dread || 8);
    var html = ""
      + '<div style="font-size:.82rem;color:var(--muted2);margin-bottom:.45rem;">GM requested a synchronized campaign roll.</div>'
      + '<div style="font-size:.9rem;color:var(--text2);margin-bottom:.55rem;"><strong>' + escapeHtml(activeRequest.label || "Dread Check") + '</strong><br>'
      + 'Roll <strong style="color:var(--teal);">' + escapeHtml(stat.toUpperCase()) + '</strong> against <strong style="color:var(--red2);">Dread d' + dread + '</strong>.</div>'
      + '<div style="display:flex;gap:.35rem;justify-content:flex-end;">'
      + '<button class="btn btn-sm btn-teal" onclick="window.campaignSystem.submitActiveRoll()">Roll Now</button>'
      + '<button class="btn btn-sm" onclick="closeModal()">Later</button>'
      + "</div>";

    if (typeof window.openModal === "function") {
      window.openModal("Campaign Roll Request", html);
    }
    safeNotif("GM called a campaign roll.", "info");
  }

  function resolveActionDie(stat) {
    if (typeof window.getEffectiveDie === "function") {
      return Number(window.getEffectiveDie(stat) || 4);
    }
    if (typeof window.S !== "undefined" && window.S && window.S.stats) {
      return Number(window.S.stats[stat] || 4);
    }
    return 4;
  }

  async function createCampaign() {
    if (!ensureSocket()) {
      safeNotif("Multiplayer requires running the local campaign server.", "warn");
      return;
    }

    var name = readUiValue("campaignNameInput").trim() || ensureName();
    var joinPass = readUiValue("campaignPasswordInput");
    state.playerName = name;
    state.uiDraft.name = name;

    var res = await emitWithAck("campaign:create", { name: name, password: joinPass });
    if (!res.ok) {
      safeNotif(res.error || "Could not create campaign.", "warn");
      return;
    }

    state.code = res.code;
    state.role = "gm";
    state.token = String(res.token || "");
    state.playerName = String(res.name || name || "GM");
    state.activePromptId = "";
    state.uiDraft.code = res.code;
    state.uiDraft.joinPassword = "";
    persistSession();

    if (window.settingsSystem && typeof window.settingsSystem.setGameMode === "function") {
      window.settingsSystem.setGameMode("gm");
    }

    safeNotif("Campaign created. Share code " + res.code + ".", "good");
    syncCharacterToCampaign(true);
    renderSettingsSection();
    renderDockPanel();
  }

  async function joinCampaign(role, options) {
    if (!ensureSocket()) {
      safeNotif("Multiplayer requires running the local campaign server.", "warn");
      return;
    }

    var opts = options || {};
    var session = loadSession();

    var name = (opts.name || readUiValue("campaignNameInput") || "").trim() || ensureName();
    var codeRaw = opts.code || readUiValue("campaignCodeInput") || (session ? session.code : "");
    var code = formatCode(codeRaw);
    var joinPass = opts.password || readUiValue("campaignPasswordInput") || "";

    if (!code) {
      if (!opts.silent) safeNotif("Enter a campaign code to join.", "warn");
      return;
    }

    state.playerName = name;
    state.uiDraft.name = name;
    state.uiDraft.code = code;
    state.uiDraft.joinPassword = joinPass;

    var res = await emitWithAck("campaign:join", {
      code: code,
      name: name,
      role: role === "gm" ? "gm" : "player",
      token: opts.token || state.token || (session ? session.token : ""),
      password: joinPass
    });

    if (!res.ok) {
      if (!opts.silent) safeNotif(res.error || "Could not join campaign.", "warn");
      return;
    }

    state.code = res.code;
    state.role = res.role;
    state.token = String(res.token || "");
    state.playerName = String(res.name || name || ensureName());
    state.activePromptId = "";
    state.uiDraft.code = res.code;
    state.uiDraft.joinPassword = "";
    persistSession();

    if (window.settingsSystem && typeof window.settingsSystem.setGameMode === "function") {
      window.settingsSystem.setGameMode(res.role === "gm" ? "gm" : "solo");
    }

    if (!opts.silent) {
      safeNotif(
        (res.restored ? "Reconnected to " : "Joined ") + "campaign " + res.code + " as " + (res.role === "gm" ? "GM" : "Player") + ".",
        "good"
      );
    }

    syncCharacterToCampaign(true);
    renderSettingsSection();
    renderDockPanel();
  }

  async function leaveCampaign() {
    if (state.socket) {
      await emitWithAck("campaign:leave", {});
    }

    state.code = "";
    state.role = "";
    state.token = "";
    state.campaign = null;
    state.activePromptId = "";
    state.uiDraft.joinPassword = "";
    clearSession();

    safeNotif("Left campaign.", "warn");
    renderSettingsSection();
    renderDockPanel();
  }

  async function callRollRequest() {
    if (!state.socket || state.role !== "gm") {
      safeNotif("Only connected GM can call campaign rolls.", "warn");
      return;
    }

    var label = readUiValue("campaignRollLabel").trim() || "Dread Check";
    var stat = readUiValue("campaignRollStat").trim().toLowerCase() || "adventure";
    var dread = Math.max(1, Number(readUiValue("campaignRollDread") || 8));

    var res = await emitWithAck("campaign:rollRequest", { label: label, stat: stat, dread: dread });
    if (!res.ok) {
      safeNotif(res.error || "Could not create roll request.", "warn");
      return;
    }
    safeNotif("Roll request sent to campaign.", "good");
  }

  async function closeActiveRoll() {
    if (!state.socket || state.role !== "gm") {
      safeNotif("Only connected GM can close roll requests.", "warn");
      return;
    }
    var res = await emitWithAck("campaign:closeRoll", {});
    if (!res.ok) {
      safeNotif(res.error || "Could not close roll request.", "warn");
      return;
    }
    safeNotif("Active roll request closed.", "good");
  }

  async function savePrivateNote() {
    if (!state.socket || !state.code) {
      safeNotif("Join a campaign first.", "warn");
      return;
    }
    var note = readUiValue("campaignPrivateNoteInput");
    var res = await emitWithAck("campaign:privateNote", { text: note });
    if (!res.ok) {
      safeNotif(res.error || "Could not save notes.", "warn");
      return;
    }
    safeNotif("Private notes saved.", "good");
  }

  async function setCampaignPassword() {
    if (!state.socket || state.role !== "gm") {
      safeNotif("Only connected GM can update campaign password.", "warn");
      return;
    }
    var password = readUiValue("campaignSetPasswordInput");
    var res = await emitWithAck("campaign:setPassword", { password: password });
    if (!res.ok) {
      safeNotif(res.error || "Could not update campaign password.", "warn");
      return;
    }
    safeNotif(password.trim() ? "Campaign password updated." : "Campaign password removed.", "good");
  }

  async function toggleArchive() {
    if (!state.socket || state.role !== "gm") {
      safeNotif("Only connected GM can change archive state.", "warn");
      return;
    }
    var archived = !!(state.campaign && state.campaign.archived);
    var evt = archived ? "campaign:unarchive" : "campaign:archive";
    var res = await emitWithAck(evt, {});
    if (!res.ok) {
      safeNotif(res.error || "Could not update campaign archive state.", "warn");
      return;
    }
    safeNotif(archived ? "Campaign reopened." : "Campaign archived.", "good");
  }

  async function deleteCampaign() {
    if (!state.socket || state.role !== "gm") {
      safeNotif("Only connected GM can delete campaigns.", "warn");
      return;
    }
    var ok = window.confirm("Delete this campaign for everyone? This cannot be undone.");
    if (!ok) return;

    var res = await emitWithAck("campaign:delete", {});
    if (!res.ok) {
      safeNotif(res.error || "Could not delete campaign.", "warn");
      return;
    }

    var oldCode = state.code;
    state.code = "";
    state.role = "";
    state.token = "";
    state.campaign = null;
    state.activePromptId = "";
    state.uiDraft.code = "";
    state.uiDraft.joinPassword = "";
    clearSession();
    safeNotif("Deleted campaign " + oldCode + ".", "warn");
    renderSettingsSection();
    renderDockPanel();
  }

  function setTimelineFilter(mode) {
    var next = String(mode || "all");
    if (["all", "chat", "roll", "system"].indexOf(next) === -1) next = "all";
    state.timelineFilter = next;
    renderDockPanel();
  }

  async function submitActiveRoll() {
    var req = state.campaign && state.campaign.activeRollRequest;
    if (!req) {
      safeNotif("No active campaign roll request.", "warn");
      return;
    }

    var stat = String(req.stat || "adventure").toLowerCase();
    var actionDie = resolveActionDie(stat);
    var action = (typeof window.explodingRoll === "function")
      ? window.explodingRoll(actionDie, { type: "action", major: true, label: "Campaign " + stat })
      : { total: Math.floor(Math.random() * actionDie) + 1 };
    var dreadRoll = (typeof window.explodingRoll === "function")
      ? window.explodingRoll(req.dread, { type: "dread", major: true, label: "Campaign Dread" })
      : { total: Math.floor(Math.random() * req.dread) + 1 };

    var res = await emitWithAck("campaign:rollSubmit", {
      requestId: req.id,
      total: action.total,
      dreadTotal: dreadRoll.total,
      die: actionDie
    });

    if (!res.ok) {
      safeNotif(res.error || "Could not submit roll.", "warn");
      return;
    }

    if (typeof window.closeModal === "function") {
      window.closeModal();
    }

    safeNotif(
      "Submitted: " + stat.toUpperCase() + " d" + actionDie + " " + action.total + " vs " + dreadRoll.total + ".",
      action.total >= dreadRoll.total ? "good" : "warn"
    );
  }

  async function sendChatMessage() {
    if (!state.socket || !state.code) {
      safeNotif("Join a campaign first.", "warn");
      return;
    }

    var input = document.getElementById("campaignDockChatInput");
    var msg = input ? String(input.value || "").trim() : "";
    if (!msg) return;

    var res = await emitWithAck("campaign:chat", { message: msg });
    if (!res.ok) {
      safeNotif(res.error || "Could not send chat message.", "warn");
      return;
    }

    if (input) input.value = "";
  }

  function toggleDock() {
    state.dockOpen = !state.dockOpen;
    renderDockPanel();
  }

  function init() {
    patchTmwHooks();
    ensureSettingsSection();
    ensureDockPanel();
    ensureSocket();
    window.addEventListener("resize", function () { syncDockOffset(); });

    if (typeof window.saveCharacter === "function" && !window._campaignWrappedSaveCharacter) {
      var baseSaveCharacter = window.saveCharacter;
      window.saveCharacter = function () {
        var out = baseSaveCharacter.apply(this, arguments);
        syncCharacterToCampaign(true);
        return out;
      };
      window._campaignWrappedSaveCharacter = true;
    }

    if (typeof window.loadCharacter === "function" && !window._campaignWrappedLoadCharacter) {
      var baseLoadCharacter = window.loadCharacter;
      window.loadCharacter = function () {
        var out = baseLoadCharacter.apply(this, arguments);
        syncCharacterToCampaign(true);
        return out;
      };
      window._campaignWrappedLoadCharacter = true;
    }

    state.ready = true;
  }

  setInterval(function () {
    patchTmwHooks();
    if (!document.getElementById("campaignSettingsSection")) {
      ensureSettingsSection();
    }
    ensureDockPanel();
    syncDockOffset();
    syncCharacterToCampaign(false);
    syncSharedState("tick");
  }, 1200);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.campaignSystem = {
    createCampaign: createCampaign,
    joinCampaign: joinCampaign,
    leaveCampaign: leaveCampaign,
    callRollRequest: callRollRequest,
    closeActiveRoll: closeActiveRoll,
    submitActiveRoll: submitActiveRoll,
    savePrivateNote: savePrivateNote,
    setCampaignPassword: setCampaignPassword,
    toggleArchive: toggleArchive,
    deleteCampaign: deleteCampaign,
    setTimelineFilter: setTimelineFilter,
    generateWayfarerIdea: generateWayfarerIdea,
    setWayfarerSort: setWayfarerSort,
    sendChatMessage: sendChatMessage,
    toggleDock: toggleDock,
    syncSharedNow: syncSharedNow,
    shareBackpackItem: shareBackpackItem,
    claimSharedItem: claimSharedItem,
    copyRosterItem: copyRosterItem,
    refreshUI: function () {
      renderSettingsSection();
      renderDockPanel();
    },
    getState: function () {
      return {
        connected: state.connected,
        code: state.code,
        role: state.role,
        token: state.token,
        campaign: state.campaign
      };
    }
  };
})();
