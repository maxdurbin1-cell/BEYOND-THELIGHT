const fs = require("fs");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = Number(process.env.PORT || 3000);
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TOKEN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz";
const STORE_PATH = path.join(__dirname, "campaign-data.json");

const campaigns = new Map();
let persistTimer = null;
let persistQueued = false;

function randomFromChars(length, chars) {
  let value = "";
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * chars.length);
    value += chars[idx];
  }
  return value;
}

function randomCode(length) {
  return randomFromChars(length, CODE_CHARS);
}

function randomToken(length) {
  return randomFromChars(length, TOKEN_CHARS);
}

function hashPassword(password, salt) {
  const s = String(salt || "");
  return crypto.createHash("sha256").update(String(password || "") + ":" + s).digest("hex");
}

function createPasswordPack(password) {
  const pass = String(password || "").trim();
  if (!pass) return null;
  const salt = randomToken(12);
  const hash = hashPassword(pass, salt);
  return { salt, hash };
}

function verifyPassword(campaign, passwordInput) {
  if (!campaign.passwordHash || !campaign.passwordSalt) return true;
  const input = String(passwordInput || "");
  if (!input.trim()) return false;
  return hashPassword(input, campaign.passwordSalt) === campaign.passwordHash;
}

function createCampaignCode() {
  let tries = 0;
  while (tries < 2000) {
    const code = randomCode(6);
    if (!campaigns.has(code)) {
      return code;
    }
    tries += 1;
  }
  throw new Error("Could not allocate campaign code");
}

function createParticipantToken(campaign) {
  let tries = 0;
  while (tries < 5000) {
    const token = randomToken(16);
    if (!campaign.participants.has(token)) {
      return token;
    }
    tries += 1;
  }
  throw new Error("Could not allocate participant token");
}

function ensureCampaignShape(raw) {
  const normalized = {
    code: String((raw && raw.code) || ""),
    shared: {
      tmw: Math.max(0, Number(raw && raw.shared ? raw.shared.tmw : 0) || 0)
    },
    participants: new Map(),
    sessions: new Map(),
    gmToken: raw && raw.gmToken ? String(raw.gmToken) : "",
    archived: !!(raw && raw.archived),
    passwordHash: raw && raw.passwordHash ? String(raw.passwordHash) : "",
    passwordSalt: raw && raw.passwordSalt ? String(raw.passwordSalt) : "",
    privateNotes: new Map(),
    activeRollRequest: null,
    log: Array.isArray(raw && raw.log) ? raw.log.slice(-250) : [],
    updatedAt: Number(raw && raw.updatedAt) || Date.now()
  };

  const participantList = Array.isArray(raw && raw.participants) ? raw.participants : [];
  for (let i = 0; i < participantList.length; i += 1) {
    const p = participantList[i] || {};
    const token = String(p.token || "").trim();
    if (!token) continue;
    normalized.participants.set(token, {
      token,
      name: String(p.name || "Player").trim().slice(0, 32) || "Player",
      role: p.role === "gm" ? "gm" : "player",
      lastSeenAt: Number(p.lastSeenAt) || Date.now(),
      character: p && p.character && typeof p.character === "object"
        ? {
            name: String(p.character.name || p.name || "Wayfarer").slice(0, 48),
            health: Math.max(0, Number(p.character.health || 0)),
            stress: Math.max(0, Number(p.character.stress || 0)),
            look: String(p.character.look || "").slice(0, 180),
            stats: p.character.stats && typeof p.character.stats === "object" ? p.character.stats : {},
            updatedAt: Number(p.character.updatedAt) || Date.now()
          }
        : null
    });
  }

  if (normalized.gmToken && !normalized.participants.has(normalized.gmToken)) {
    normalized.gmToken = "";
  }

  const notes = Array.isArray(raw && raw.privateNotes) ? raw.privateNotes : [];
  for (let i = 0; i < notes.length; i += 1) {
    const item = notes[i] || {};
    const token = String(item.token || "").trim();
    if (!token || !normalized.participants.has(token)) continue;
    normalized.privateNotes.set(token, {
      token,
      text: String(item.text || "").slice(0, 5000),
      updatedAt: Number(item.updatedAt) || Date.now()
    });
  }

  const roll = raw && raw.activeRollRequest;
  if (roll && typeof roll === "object" && roll.id) {
    const responses = Array.isArray(roll.responses) ? roll.responses : [];
    normalized.activeRollRequest = {
      id: String(roll.id),
      stat: String(roll.stat || "adventure"),
      dread: Math.max(1, Number(roll.dread || 8)),
      label: String(roll.label || "GM Check").slice(0, 80),
      createdAt: Number(roll.createdAt) || Date.now(),
      responses: responses.map((resp) => ({
        token: String((resp && resp.token) || ""),
        name: String((resp && resp.name) || "Player"),
        role: resp && resp.role === "gm" ? "gm" : "player",
        total: Math.max(0, Number(resp && resp.total) || 0),
        dreadTotal: Math.max(0, Number(resp && resp.dreadTotal) || 0),
        die: Math.max(1, Number(resp && resp.die) || 4),
        success: !!(resp && resp.success),
        at: Number(resp && resp.at) || Date.now()
      }))
    };
  }

  return normalized;
}

function serializeCampaign(campaign) {
  return {
    code: campaign.code,
    shared: {
      tmw: Math.max(0, Number(campaign.shared.tmw || 0))
    },
    participants: Array.from(campaign.participants.values()).map((p) => ({
      token: p.token,
      name: p.name,
      role: p.role,
      lastSeenAt: Number(p.lastSeenAt || Date.now()),
      character: p.character
        ? {
            name: String(p.character.name || p.name || "Wayfarer").slice(0, 48),
            health: Math.max(0, Number(p.character.health || 0)),
            stress: Math.max(0, Number(p.character.stress || 0)),
            look: String(p.character.look || "").slice(0, 180),
            stats: p.character.stats && typeof p.character.stats === "object" ? p.character.stats : {},
            updatedAt: Number(p.character.updatedAt || Date.now())
          }
        : null
    })),
    gmToken: campaign.gmToken || "",
    archived: !!campaign.archived,
    passwordHash: campaign.passwordHash || "",
    passwordSalt: campaign.passwordSalt || "",
    privateNotes: Array.from(campaign.privateNotes.values()).map((note) => ({
      token: note.token,
      text: String(note.text || "").slice(0, 5000),
      updatedAt: Number(note.updatedAt || Date.now())
    })),
    activeRollRequest: campaign.activeRollRequest
      ? {
          id: campaign.activeRollRequest.id,
          stat: campaign.activeRollRequest.stat,
          dread: campaign.activeRollRequest.dread,
          label: campaign.activeRollRequest.label,
          createdAt: campaign.activeRollRequest.createdAt,
          responses: Array.isArray(campaign.activeRollRequest.responses)
            ? campaign.activeRollRequest.responses
            : []
        }
      : null,
    log: Array.isArray(campaign.log) ? campaign.log.slice(-250) : [],
    updatedAt: Date.now()
  };
}

function persistCampaignsNow() {
  const data = {
    version: 1,
    savedAt: Date.now(),
    campaigns: Array.from(campaigns.values()).map(serializeCampaign)
  };
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

function schedulePersist() {
  persistQueued = true;
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    if (!persistQueued) return;
    persistQueued = false;
    try {
      persistCampaignsNow();
    } catch (err) {
      console.warn("Could not persist campaigns:", err && err.message ? err.message : err);
    }
  }, 250);
}

function loadCampaignsFromDisk() {
  try {
    if (!fs.existsSync(STORE_PATH)) return;
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    if (!raw.trim()) return;
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed && parsed.campaigns) ? parsed.campaigns : [];

    for (let i = 0; i < list.length; i += 1) {
      const normalized = ensureCampaignShape(list[i]);
      if (!normalized.code) continue;
      campaigns.set(normalized.code, normalized);
    }

    if (campaigns.size > 0) {
      console.log(`Loaded ${campaigns.size} persisted campaign(s).`);
    }
  } catch (err) {
    console.warn("Could not load persisted campaigns:", err && err.message ? err.message : err);
  }
}

function getOnlineTokenSet(campaign) {
  const tokens = new Set();
  campaign.sessions.forEach((token) => {
    if (token) tokens.add(token);
  });
  return tokens;
}

function snapshotCampaign(campaign, requesterToken) {
  const onlineTokens = getOnlineTokenSet(campaign);
  const roster = Array.from(campaign.participants.values())
    .map((member) => ({
      token: member.token,
      name: member.name,
      role: member.role,
      online: onlineTokens.has(member.token),
      lastSeenAt: Number(member.lastSeenAt || Date.now()),
      character: member.character
        ? {
            name: String(member.character.name || member.name || "Wayfarer").slice(0, 48),
            health: Math.max(0, Number(member.character.health || 0)),
            stress: Math.max(0, Number(member.character.stress || 0)),
            look: String(member.character.look || "").slice(0, 180),
            stats: member.character.stats && typeof member.character.stats === "object" ? member.character.stats : {},
            updatedAt: Number(member.character.updatedAt || 0)
          }
        : null
    }))
    .sort((a, b) => {
      if (a.role === "gm" && b.role !== "gm") return -1;
      if (a.role !== "gm" && b.role === "gm") return 1;
      return a.name.localeCompare(b.name);
    });

  const requesterRole = requesterToken && campaign.gmToken && requesterToken === campaign.gmToken ? "gm" : "player";
  const requesterNote = requesterToken && campaign.privateNotes.has(requesterToken)
    ? campaign.privateNotes.get(requesterToken)
    : null;
  const notesSummary = requesterRole === "gm"
    ? Array.from(campaign.participants.values()).map((p) => {
        const note = campaign.privateNotes.get(p.token);
        return {
          token: p.token,
          name: p.name,
          updatedAt: note ? Number(note.updatedAt || 0) : 0,
          hasNote: !!(note && String(note.text || "").trim()),
          preview: note ? String(note.text || "").slice(0, 120) : ""
        };
      })
    : [];

  return {
    code: campaign.code,
    archived: !!campaign.archived,
    hasPassword: !!(campaign.passwordHash && campaign.passwordSalt),
    shared: {
      tmw: Number(campaign.shared.tmw || 0)
    },
    members: roster.filter((m) => m.online).map((m) => ({
      name: m.name,
      role: m.role,
      token: m.token
    })),
    roster,
    me: requesterToken
      ? {
          token: requesterToken,
          role: requesterRole,
          privateNote: requesterNote ? String(requesterNote.text || "") : ""
        }
      : null,
    notesSummary,
    activeRollRequest: campaign.activeRollRequest
      ? {
          id: campaign.activeRollRequest.id,
          stat: campaign.activeRollRequest.stat,
          dread: campaign.activeRollRequest.dread,
          label: campaign.activeRollRequest.label,
          createdAt: campaign.activeRollRequest.createdAt,
          responses: Array.isArray(campaign.activeRollRequest.responses)
            ? campaign.activeRollRequest.responses
            : []
        }
      : null,
    log: campaign.log.slice(-80)
  };
}

function emitCampaignState(code) {
  const campaign = campaigns.get(code);
  if (!campaign) return;
  campaign.sessions.forEach((token, socketId) => {
    io.to(socketId).emit("campaign:state", snapshotCampaign(campaign, token));
  });
}

function addLog(campaign, kind, text, meta) {
  campaign.log.push({
    id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    kind,
    text,
    meta: meta || null,
    at: Date.now()
  });
  if (campaign.log.length > 250) {
    campaign.log = campaign.log.slice(-250);
  }
  campaign.updatedAt = Date.now();
  schedulePersist();
}

function getCampaignBySocket(socket) {
  const code = socket.data && socket.data.campaignCode;
  if (!code) return null;
  return campaigns.get(code) || null;
}

function setParticipantRole(campaign, token, nextRole) {
  const member = campaign.participants.get(token);
  if (!member) return;

  if (nextRole === "gm") {
    campaign.gmToken = token;
    member.role = "gm";
  } else {
    if (campaign.gmToken && campaign.gmToken === token) {
      member.role = "gm";
    } else {
      member.role = "player";
    }
  }
}

function chooseFallbackGm(campaign) {
  if (campaign.gmToken && campaign.participants.has(campaign.gmToken)) {
    return;
  }
  const first = Array.from(campaign.participants.values())[0];
  if (!first) {
    campaign.gmToken = "";
    return;
  }
  campaign.gmToken = first.token;
  first.role = "gm";
}

function normalizeName(input, fallback) {
  return String(input || fallback || "Player").trim().slice(0, 32) || String(fallback || "Player");
}

function normalizeCharacter(input, fallbackName) {
  const c = input && typeof input === "object" ? input : {};
  const stats = c.stats && typeof c.stats === "object" ? c.stats : {};
  return {
    name: String(c.name || fallbackName || "Wayfarer").slice(0, 48),
    health: Math.max(0, Number(c.health || 0)),
    stress: Math.max(0, Number(c.stress || 0)),
    look: String(c.look || "").slice(0, 180),
    stats,
    updatedAt: Date.now()
  };
}

function resolveOrCreateParticipant(campaign, name, requestedRole, tokenHint) {
  const normalizedName = normalizeName(name, requestedRole === "gm" ? "GM" : "Player");
  const desiredRole = requestedRole === "gm" ? "gm" : "player";

  if (tokenHint) {
    const byToken = campaign.participants.get(tokenHint);
    if (byToken) {
      byToken.name = normalizedName;
      if (desiredRole === "gm") {
        if (campaign.gmToken && campaign.gmToken !== tokenHint) {
          return { error: "This campaign already has a GM." };
        }
        setParticipantRole(campaign, tokenHint, "gm");
      }
      if (!byToken.character) {
        byToken.character = normalizeCharacter(null, byToken.name);
      }
      byToken.lastSeenAt = Date.now();
      return { token: tokenHint, participant: byToken, restored: true };
    }
  }

  const sameName = Array.from(campaign.participants.values()).filter((p) => p.name.toLowerCase() === normalizedName.toLowerCase());
  if (!tokenHint && sameName.length === 1) {
    const only = sameName[0];
    if (desiredRole === "gm" && campaign.gmToken && campaign.gmToken !== only.token) {
      return { error: "This campaign already has a GM." };
    }
    only.lastSeenAt = Date.now();
    if (desiredRole === "gm") setParticipantRole(campaign, only.token, "gm");
    if (!only.character) {
      only.character = normalizeCharacter(null, only.name);
    }
    return { token: only.token, participant: only, restored: true };
  }

  if (desiredRole === "gm" && campaign.gmToken) {
    return { error: "This campaign already has a GM." };
  }

  const token = createParticipantToken(campaign);
  const participant = {
    token,
    name: normalizedName,
    role: desiredRole,
    lastSeenAt: Date.now(),
    character: normalizeCharacter(null, normalizedName)
  };

  campaign.participants.set(token, participant);
  if (desiredRole === "gm") {
    campaign.gmToken = token;
  }
  campaign.updatedAt = Date.now();
  schedulePersist();
  return { token, participant, restored: false };
}

function isGm(campaign, token) {
  return !!(token && campaign.gmToken && token === campaign.gmToken);
}

function canJoinArchivedCampaign(campaign, tokenHint) {
  if (!campaign.archived) return true;
  const token = String(tokenHint || "").trim();
  if (!token) return false;
  if (!campaign.participants.has(token)) return false;
  return true;
}

function attachSocketToCampaign(socket, campaign, token) {
  socket.join(campaign.code);
  socket.data.campaignCode = campaign.code;
  socket.data.token = token;
  socket.data.role = campaign.gmToken && campaign.gmToken === token ? "gm" : "player";
  campaign.sessions.set(socket.id, token);
}

function detachSocket(socket, opts) {
  const options = opts || {};
  const campaign = getCampaignBySocket(socket);
  if (!campaign) return;

  const token = socket.data.token || campaign.sessions.get(socket.id);
  const participant = token ? campaign.participants.get(token) : null;

  campaign.sessions.delete(socket.id);
  socket.leave(campaign.code);
  socket.data.campaignCode = "";
  socket.data.role = "";
  socket.data.token = "";

  if (participant) {
    participant.lastSeenAt = Date.now();
    if (!options.silent) {
      addLog(campaign, "system", `${participant.name} left the campaign.`);
    } else {
      schedulePersist();
    }
  }

  emitCampaignState(campaign.code);
}

app.use(express.static(path.join(__dirname)));

loadCampaignsFromDisk();

io.on("connection", (socket) => {
  socket.on("campaign:create", (payload, ack) => {
    try {
      const name = normalizeName(payload && payload.name, "GM");
      const code = createCampaignCode();
      const campaign = {
        code,
        shared: { tmw: 0 },
        participants: new Map(),
        sessions: new Map(),
        gmToken: "",
        archived: false,
        passwordHash: "",
        passwordSalt: "",
        privateNotes: new Map(),
        activeRollRequest: null,
        log: [],
        updatedAt: Date.now()
      };

      const passwordPack = createPasswordPack(payload && payload.password);
      if (passwordPack) {
        campaign.passwordSalt = passwordPack.salt;
        campaign.passwordHash = passwordPack.hash;
      }

      const token = createParticipantToken(campaign);
      campaign.participants.set(token, {
        token,
        name,
        role: "gm",
        lastSeenAt: Date.now(),
        character: normalizeCharacter(payload && payload.character, name)
      });
      campaign.gmToken = token;
      campaigns.set(code, campaign);

      attachSocketToCampaign(socket, campaign, token);
      addLog(campaign, "system", `${name} created the campaign.`);

      emitCampaignState(code);
      if (typeof ack === "function") {
        ack({
          ok: true,
          code,
          role: "gm",
          token,
          name,
          hasPassword: !!passwordPack
        });
      }
    } catch (_err) {
      if (typeof ack === "function") ack({ ok: false, error: "Could not create campaign." });
    }
  });

  socket.on("campaign:join", (payload, ack) => {
    const code = String((payload && payload.code) || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const role = (payload && payload.role) === "gm" ? "gm" : "player";
    const name = normalizeName(payload && payload.name, role === "gm" ? "GM" : "Player");
    const tokenHint = String((payload && payload.token) || "").trim();
    const passwordInput = String((payload && payload.password) || "");
    const campaign = campaigns.get(code);

    if (!campaign) {
      if (typeof ack === "function") ack({ ok: false, error: "Campaign code not found." });
      return;
    }

    if (!canJoinArchivedCampaign(campaign, tokenHint)) {
      if (typeof ack === "function") ack({ ok: false, error: "Campaign is archived. Ask GM to reopen it." });
      return;
    }

    const hasValidToken = !!(tokenHint && campaign.participants.has(tokenHint));
    if (!hasValidToken && !verifyPassword(campaign, passwordInput)) {
      if (typeof ack === "function") ack({ ok: false, error: "Incorrect campaign password." });
      return;
    }

    detachSocket(socket, { silent: true });

    const resolved = resolveOrCreateParticipant(campaign, name, role, tokenHint || "");
    if (resolved.error) {
      if (typeof ack === "function") ack({ ok: false, error: resolved.error });
      return;
    }

    const token = resolved.token;
    const participant = resolved.participant;
    attachSocketToCampaign(socket, campaign, token);

    addLog(
      campaign,
      "system",
      `${participant.name} ${resolved.restored ? "reconnected" : "joined"} as ${participant.role === "gm" ? "GM" : "Player"}.`
    );

    emitCampaignState(code);
    if (typeof ack === "function") {
      ack({
        ok: true,
        code,
        role: participant.role,
        token,
        name: participant.name,
        restored: !!resolved.restored
      });
    }
  });

  socket.on("campaign:leave", (_payload, ack) => {
    detachSocket(socket, { silent: false });
    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("campaign:setTmw", (payload, ack) => {
    const campaign = getCampaignBySocket(socket);
    if (!campaign) {
      if (typeof ack === "function") ack({ ok: false, error: "Not connected to a campaign." });
      return;
    }

    const value = Math.max(0, Number((payload && payload.value) || 0));
    const token = socket.data.token;
    const member = token ? campaign.participants.get(token) : null;
    campaign.shared.tmw = value;
    campaign.updatedAt = Date.now();
    addLog(campaign, "tmw", `${member ? member.name : "Someone"} set Teamwork to ${value}.`, { value });

    emitCampaignState(campaign.code);
    if (typeof ack === "function") ack({ ok: true, value });
  });

  socket.on("campaign:deltaTmw", (payload, ack) => {
    const campaign = getCampaignBySocket(socket);
    if (!campaign) {
      if (typeof ack === "function") ack({ ok: false, error: "Not connected to a campaign." });
      return;
    }

    const delta = Number((payload && payload.delta) || 0);
    const next = Math.max(0, Number(campaign.shared.tmw || 0) + delta);
    const token = socket.data.token;
    const member = token ? campaign.participants.get(token) : null;
    campaign.shared.tmw = next;
    campaign.updatedAt = Date.now();
    addLog(campaign, "tmw", `${member ? member.name : "Someone"} changed Teamwork by ${delta > 0 ? "+" : ""}${delta} (now ${next}).`, { delta, value: next });

    emitCampaignState(campaign.code);
    if (typeof ack === "function") ack({ ok: true, value: next });
  });

  socket.on("campaign:chat", (payload, ack) => {
    const campaign = getCampaignBySocket(socket);
    if (!campaign) {
      if (typeof ack === "function") ack({ ok: false, error: "Not connected to a campaign." });
      return;
    }

    const message = String((payload && payload.message) || "").trim().slice(0, 500);
    if (!message) {
      if (typeof ack === "function") ack({ ok: false, error: "Message is empty." });
      return;
    }

    const token = socket.data.token;
    const member = token ? campaign.participants.get(token) : null;
    const name = member ? member.name : "Player";

    addLog(campaign, "chat", `${name}: ${message}`, {
      token: token || "",
      name,
      message
    });

    emitCampaignState(campaign.code);
    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("campaign:privateNote", (payload, ack) => {
    const campaign = getCampaignBySocket(socket);
    if (!campaign) {
      if (typeof ack === "function") ack({ ok: false, error: "Not connected to a campaign." });
      return;
    }

    const token = socket.data.token;
    if (!token || !campaign.participants.has(token)) {
      if (typeof ack === "function") ack({ ok: false, error: "Invalid participant session." });
      return;
    }

    const text = String((payload && payload.text) || "").slice(0, 5000);
    const trimmed = text.trim();
    if (!trimmed) {
      campaign.privateNotes.delete(token);
    } else {
      campaign.privateNotes.set(token, {
        token,
        text,
        updatedAt: Date.now()
      });
    }

    const participant = campaign.participants.get(token);
    addLog(campaign, "note", `${participant ? participant.name : "Player"} updated private notes.`, {
      token
    });
    emitCampaignState(campaign.code);
    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("campaign:updateCharacter", (payload, ack) => {
    const campaign = getCampaignBySocket(socket);
    if (!campaign) {
      if (typeof ack === "function") ack({ ok: false, error: "Not connected to a campaign." });
      return;
    }

    const token = socket.data.token;
    if (!token || !campaign.participants.has(token)) {
      if (typeof ack === "function") ack({ ok: false, error: "Invalid participant session." });
      return;
    }

    const participant = campaign.participants.get(token);
    participant.character = normalizeCharacter(payload && payload.character, participant.name);
    participant.lastSeenAt = Date.now();
    campaign.updatedAt = Date.now();
    schedulePersist();

    emitCampaignState(campaign.code);
    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("campaign:archive", (_payload, ack) => {
    const campaign = getCampaignBySocket(socket);
    if (!campaign) {
      if (typeof ack === "function") ack({ ok: false, error: "Not connected to a campaign." });
      return;
    }
    const token = socket.data.token;
    if (!isGm(campaign, token)) {
      if (typeof ack === "function") ack({ ok: false, error: "Only GM can archive campaigns." });
      return;
    }
    campaign.archived = true;
    addLog(campaign, "system", "GM archived this campaign.");
    emitCampaignState(campaign.code);
    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("campaign:unarchive", (_payload, ack) => {
    const campaign = getCampaignBySocket(socket);
    if (!campaign) {
      if (typeof ack === "function") ack({ ok: false, error: "Not connected to a campaign." });
      return;
    }
    const token = socket.data.token;
    if (!isGm(campaign, token)) {
      if (typeof ack === "function") ack({ ok: false, error: "Only GM can reopen campaigns." });
      return;
    }
    campaign.archived = false;
    addLog(campaign, "system", "GM reopened this campaign.");
    emitCampaignState(campaign.code);
    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("campaign:setPassword", (payload, ack) => {
    const campaign = getCampaignBySocket(socket);
    if (!campaign) {
      if (typeof ack === "function") ack({ ok: false, error: "Not connected to a campaign." });
      return;
    }
    const token = socket.data.token;
    if (!isGm(campaign, token)) {
      if (typeof ack === "function") ack({ ok: false, error: "Only GM can set password." });
      return;
    }

    const password = String((payload && payload.password) || "").trim();
    if (!password) {
      campaign.passwordHash = "";
      campaign.passwordSalt = "";
      addLog(campaign, "system", "GM removed the campaign password.");
    } else {
      const pack = createPasswordPack(password);
      campaign.passwordHash = pack.hash;
      campaign.passwordSalt = pack.salt;
      addLog(campaign, "system", "GM updated the campaign password.");
    }
    campaign.updatedAt = Date.now();
    schedulePersist();
    emitCampaignState(campaign.code);
    if (typeof ack === "function") ack({ ok: true, hasPassword: !!campaign.passwordHash });
  });

  socket.on("campaign:delete", (_payload, ack) => {
    const campaign = getCampaignBySocket(socket);
    if (!campaign) {
      if (typeof ack === "function") ack({ ok: false, error: "Not connected to a campaign." });
      return;
    }
    const token = socket.data.token;
    if (!isGm(campaign, token)) {
      if (typeof ack === "function") ack({ ok: false, error: "Only GM can delete campaigns." });
      return;
    }

    campaign.sessions.forEach((_t, socketId) => {
      io.to(socketId).emit("campaign:deleted", {
        code: campaign.code,
        message: "Campaign deleted by GM."
      });
      const client = io.sockets.sockets.get(socketId);
      if (client) {
        client.leave(campaign.code);
        client.data.campaignCode = "";
        client.data.role = "";
        client.data.token = "";
      }
    });

    campaigns.delete(campaign.code);
    schedulePersist();
    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("campaign:rollRequest", (payload, ack) => {
    const campaign = getCampaignBySocket(socket);
    if (!campaign) {
      if (typeof ack === "function") ack({ ok: false, error: "Not connected to a campaign." });
      return;
    }

    const token = socket.data.token;
    if (!token || !campaign.gmToken || campaign.gmToken !== token) {
      if (typeof ack === "function") ack({ ok: false, error: "Only the GM can call campaign rolls." });
      return;
    }

    const dread = Math.max(1, Number((payload && payload.dread) || 8));
    const stat = String((payload && payload.stat) || "adventure").trim().slice(0, 32) || "adventure";
    const label = String((payload && payload.label) || "GM Check").trim().slice(0, 80) || "GM Check";

    campaign.activeRollRequest = {
      id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      stat,
      dread,
      label,
      createdAt: Date.now(),
      responses: []
    };

    const gm = campaign.participants.get(token);
    addLog(campaign, "roll", `${gm ? gm.name : "GM"} called ${label}: ${stat.toUpperCase()} vs Dread d${dread}.`, {
      stat,
      dread,
      label
    });

    emitCampaignState(campaign.code);
    if (typeof ack === "function") ack({ ok: true, requestId: campaign.activeRollRequest.id });
  });

  socket.on("campaign:rollSubmit", (payload, ack) => {
    const campaign = getCampaignBySocket(socket);
    if (!campaign || !campaign.activeRollRequest) {
      if (typeof ack === "function") ack({ ok: false, error: "No active roll request." });
      return;
    }

    const requestId = String((payload && payload.requestId) || "");
    if (requestId !== campaign.activeRollRequest.id) {
      if (typeof ack === "function") ack({ ok: false, error: "Roll request is no longer active." });
      return;
    }

    const total = Math.max(0, Number((payload && payload.total) || 0));
    const dreadTotal = Math.max(0, Number((payload && payload.dreadTotal) || 0));
    const die = Math.max(1, Number((payload && payload.die) || 4));

    const token = socket.data.token || "";
    const member = token ? campaign.participants.get(token) : null;
    const response = {
      token,
      name: member ? member.name : "Player",
      role: member ? member.role : "player",
      total,
      dreadTotal,
      die,
      success: total >= dreadTotal,
      at: Date.now()
    };

    const existingIdx = campaign.activeRollRequest.responses.findIndex((resp) => resp.token === token);
    if (existingIdx >= 0) {
      campaign.activeRollRequest.responses[existingIdx] = response;
    } else {
      campaign.activeRollRequest.responses.push(response);
    }

    addLog(
      campaign,
      "roll-result",
      `${response.name} rolled ${campaign.activeRollRequest.stat.toUpperCase()} d${response.die}: ${response.total} vs ${response.dreadTotal} (${response.success ? "success" : "fail"}).`,
      response
    );
    emitCampaignState(campaign.code);

    if (typeof ack === "function") ack({ ok: true, response });
  });

  socket.on("campaign:closeRoll", (_payload, ack) => {
    const campaign = getCampaignBySocket(socket);
    if (!campaign) {
      if (typeof ack === "function") ack({ ok: false, error: "Not connected to a campaign." });
      return;
    }

    const token = socket.data.token;
    if (!token || token !== campaign.gmToken) {
      if (typeof ack === "function") ack({ ok: false, error: "Only the GM can close roll requests." });
      return;
    }

    campaign.activeRollRequest = null;
    addLog(campaign, "roll", "GM closed the active roll request.");
    emitCampaignState(campaign.code);

    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("disconnect", () => {
    detachSocket(socket, { silent: true });
  });
});

process.on("SIGINT", () => {
  try {
    persistCampaignsNow();
  } catch (_err) {}
  process.exit(0);
});

process.on("SIGTERM", () => {
  try {
    persistCampaignsNow();
  } catch (_err) {}
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`BEYOND-THE-LIGHT campaign server running at http://localhost:${PORT}`);
});
