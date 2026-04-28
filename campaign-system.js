// campaign-system.js — Multiplayer campaign rooms (Phase 1)
(function () {
  var state = {
    socket: null,
    connected: false,
    ready: false,
    code: "",
    role: "",
    playerName: "",
    campaign: null,
    suppressTmwEmit: false,
    lastKnownTmw: null,
    activePromptId: ""
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

  function renderMembers(list) {
    if (!Array.isArray(list) || !list.length) {
      return '<div class="campaign-muted">No connected members.</div>';
    }
    return list.map(function (m) {
      var roleTag = m.role === "gm" ? "<span class=\"campaign-pill gm\">GM</span>" : "<span class=\"campaign-pill\">Player</span>";
      return '<div class="campaign-member-row"><span>' + escapeHtml(m.name || "Player") + '</span>' + roleTag + "</div>";
    }).join("");
  }

  function renderLog(log) {
    if (!Array.isArray(log) || !log.length) {
      return '<div class="campaign-muted">No events yet.</div>';
    }
    return log.slice(-8).reverse().map(function (entry) {
      var kind = escapeHtml(entry.kind || "system");
      var text = escapeHtml(entry.text || "");
      return '<div class="campaign-log-row"><span class="campaign-log-kind">' + kind + '</span><span>' + text + "</span></div>";
    }).join("");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
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
    }

    renderSettingsSection();
  }

  function renderSettingsSection() {
    var section = document.getElementById("campaignSettingsSection");
    if (!section) return;

    var ioReady = canUseSockets();
    var campaign = state.campaign;
    var sharedTmw = campaign && campaign.shared ? Number(campaign.shared.tmw || 0) : getTmwValue();
    var isGm = state.role === "gm";
    var active = campaign && campaign.activeRollRequest;

    section.innerHTML = ""
      + '<h4>Campaign (Multiplayer Beta)</h4>'
      + '<div class="campaign-status-row">'
      + '<span class="campaign-badge ' + (state.connected ? "online" : "offline") + '">' + (state.connected ? "Online" : (ioReady ? "Offline" : "Server Script Missing")) + "</span>"
      + '<span class="campaign-muted">Code: <strong style="color:var(--teal);">' + escapeHtml(state.code || "-") + "</strong></span>"
      + "</div>"
      + '<div class="setting-row">'
      + '<label>Display Name</label>'
      + '<input id="campaignNameInput" class="campaign-input" type="text" maxlength="32" value="' + escapeHtml(ensureName()) + '" placeholder="Wayfarer Name">'
      + "</div>"
      + '<div class="setting-row">'
      + '<label>Campaign Code</label>'
      + '<input id="campaignCodeInput" class="campaign-input" type="text" maxlength="12" placeholder="ABC123">'
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
      + '<div class="campaign-muted">This pool syncs for all members in the campaign room.</div>'
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
      + '<div class="campaign-card">'
      + '<div class="campaign-card-title">Members</div>'
      + renderMembers(campaign ? campaign.members : [])
      + "</div>"
      + '<div class="campaign-card">'
      + '<div class="campaign-card-title">Campaign Log</div>'
      + renderLog(campaign ? campaign.log : [])
      + "</div>";
  }

  function readUiValue(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || "") : "";
  }

  function ensureSocket() {
    if (!canUseSockets()) {
      return false;
    }
    if (state.socket) return true;

    state.socket = window.io({ transports: ["websocket", "polling"] });

    state.socket.on("connect", function () {
      state.connected = true;
      safeNotif("Campaign server connected.", "good");
      renderSettingsSection();
    });

    state.socket.on("disconnect", function () {
      state.connected = false;
      renderSettingsSection();
    });

    state.socket.on("campaign:state", function (snapshot) {
      state.campaign = snapshot || null;
      state.code = snapshot && snapshot.code ? String(snapshot.code) : "";
      var nextTmw = snapshot && snapshot.shared ? Number(snapshot.shared.tmw || 0) : null;
      if (nextTmw !== null && nextTmw !== getTmwValue()) {
        setLocalTmw(nextTmw);
      }
      maybePromptActiveRoll(snapshot && snapshot.activeRollRequest ? snapshot.activeRollRequest : null);
      renderSettingsSection();
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
    state.playerName = name;

    var res = await emitWithAck("campaign:create", { name: name });
    if (!res.ok) {
      safeNotif(res.error || "Could not create campaign.", "warn");
      return;
    }

    state.code = res.code;
    state.role = "gm";
    state.activePromptId = "";
    if (window.settingsSystem && typeof window.settingsSystem.setGameMode === "function") {
      window.settingsSystem.setGameMode("gm");
    }
    safeNotif("Campaign created. Share code " + res.code + ".", "good");
    renderSettingsSection();
  }

  async function joinCampaign(role) {
    if (!ensureSocket()) {
      safeNotif("Multiplayer requires running the local campaign server.", "warn");
      return;
    }

    var name = readUiValue("campaignNameInput").trim() || ensureName();
    var code = formatCode(readUiValue("campaignCodeInput"));
    if (!code) {
      safeNotif("Enter a campaign code to join.", "warn");
      return;
    }

    state.playerName = name;
    var res = await emitWithAck("campaign:join", { code: code, name: name, role: role === "gm" ? "gm" : "player" });
    if (!res.ok) {
      safeNotif(res.error || "Could not join campaign.", "warn");
      return;
    }

    state.code = res.code;
    state.role = res.role;
    state.activePromptId = "";
    if (window.settingsSystem && typeof window.settingsSystem.setGameMode === "function") {
      window.settingsSystem.setGameMode(res.role === "gm" ? "gm" : "solo");
    }
    safeNotif("Joined campaign " + res.code + " as " + (res.role === "gm" ? "GM" : "Player") + ".", "good");
    renderSettingsSection();
  }

  async function leaveCampaign() {
    if (!state.socket) {
      state.code = "";
      state.role = "";
      state.campaign = null;
      renderSettingsSection();
      return;
    }
    await emitWithAck("campaign:leave", {});
    state.code = "";
    state.role = "";
    state.campaign = null;
    state.activePromptId = "";
    safeNotif("Left campaign.", "warn");
    renderSettingsSection();
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

    safeNotif("Submitted: " + stat.toUpperCase() + " d" + actionDie + " " + action.total + " vs " + dreadRoll.total + ".", action.total >= dreadRoll.total ? "good" : "warn");
  }

  function init() {
    patchTmwHooks();
    ensureSettingsSection();
    state.ready = true;
  }

  // settings panel can be rebuilt; keep campaign section mounted.
  setInterval(function () {
    patchTmwHooks();
    ensureSettingsSection();
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
    refreshUI: renderSettingsSection,
    getState: function () {
      return {
        connected: state.connected,
        code: state.code,
        role: state.role,
        campaign: state.campaign
      };
    }
  };
})();
