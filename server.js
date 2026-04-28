const path = require("path");
const http = require("http");
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

const campaigns = new Map();

function randomCode(length) {
  let value = "";
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * CODE_CHARS.length);
    value += CODE_CHARS[idx];
  }
  return value;
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

function snapshotCampaign(campaign) {
  return {
    code: campaign.code,
    shared: {
      tmw: Number(campaign.shared.tmw || 0)
    },
    members: Array.from(campaign.members.values()).map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role
    })),
    activeRollRequest: campaign.activeRollRequest
      ? {
          id: campaign.activeRollRequest.id,
          stat: campaign.activeRollRequest.stat,
          dread: campaign.activeRollRequest.dread,
          label: campaign.activeRollRequest.label,
          createdAt: campaign.activeRollRequest.createdAt,
          responses: campaign.activeRollRequest.responses
        }
      : null,
    log: campaign.log.slice(-30)
  };
}

function emitCampaignState(code) {
  const campaign = campaigns.get(code);
  if (!campaign) return;
  io.to(code).emit("campaign:state", snapshotCampaign(campaign));
}

function addLog(campaign, kind, text, meta) {
  campaign.log.push({
    id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    kind,
    text,
    meta: meta || null,
    at: Date.now()
  });
  if (campaign.log.length > 200) {
    campaign.log = campaign.log.slice(-200);
  }
}

function getCampaignBySocket(socket) {
  const code = socket.data && socket.data.campaignCode;
  if (!code) return null;
  return campaigns.get(code) || null;
}

function removeMember(socket) {
  const campaign = getCampaignBySocket(socket);
  if (!campaign) return;

  const member = campaign.members.get(socket.id);
  if (member) {
    campaign.members.delete(socket.id);
    addLog(campaign, "system", `${member.name} left the campaign.`);
  }

  socket.leave(campaign.code);
  socket.data.campaignCode = null;
  socket.data.role = null;

  if (campaign.members.size === 0) {
    campaigns.delete(campaign.code);
    return;
  }

  if (campaign.gmSocketId === socket.id) {
    const nextGm = Array.from(campaign.members.values()).find((m) => m.role === "gm");
    campaign.gmSocketId = nextGm ? nextGm.id : null;
    if (!nextGm) {
      const fallback = Array.from(campaign.members.values())[0] || null;
      if (fallback) {
        fallback.role = "gm";
        campaign.gmSocketId = fallback.id;
        addLog(campaign, "system", `${fallback.name} is now the GM.`);
      }
    }
  }

  emitCampaignState(campaign.code);
}

app.use(express.static(path.join(__dirname)));

io.on("connection", (socket) => {
  socket.on("campaign:create", (payload, ack) => {
    try {
      const name = String((payload && payload.name) || "GM").trim().slice(0, 32) || "GM";
      const code = createCampaignCode();
      const campaign = {
        code,
        shared: { tmw: 0 },
        members: new Map(),
        gmSocketId: socket.id,
        activeRollRequest: null,
        log: []
      };

      const gmMember = { id: socket.id, name, role: "gm" };
      campaign.members.set(socket.id, gmMember);
      addLog(campaign, "system", `${name} created the campaign.`);
      campaigns.set(code, campaign);

      socket.join(code);
      socket.data.campaignCode = code;
      socket.data.role = "gm";

      emitCampaignState(code);
      if (typeof ack === "function") ack({ ok: true, code, role: "gm" });
    } catch (err) {
      if (typeof ack === "function") ack({ ok: false, error: "Could not create campaign." });
    }
  });

  socket.on("campaign:join", (payload, ack) => {
    const rawCode = String((payload && payload.code) || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const name = String((payload && payload.name) || "Player").trim().slice(0, 32) || "Player";
    const role = (payload && payload.role) === "gm" ? "gm" : "player";
    const campaign = campaigns.get(rawCode);

    if (!campaign) {
      if (typeof ack === "function") ack({ ok: false, error: "Campaign code not found." });
      return;
    }

    if (role === "gm" && campaign.gmSocketId && campaign.gmSocketId !== socket.id) {
      if (typeof ack === "function") ack({ ok: false, error: "This campaign already has a GM." });
      return;
    }

    removeMember(socket);

    socket.join(rawCode);
    socket.data.campaignCode = rawCode;
    socket.data.role = role;

    campaign.members.set(socket.id, { id: socket.id, name, role });
    if (role === "gm") {
      campaign.gmSocketId = socket.id;
    }

    addLog(campaign, "system", `${name} joined as ${role === "gm" ? "GM" : "Player"}.`);
    emitCampaignState(rawCode);

    if (typeof ack === "function") ack({ ok: true, code: rawCode, role });
  });

  socket.on("campaign:leave", (_payload, ack) => {
    removeMember(socket);
    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("campaign:setTmw", (payload, ack) => {
    const campaign = getCampaignBySocket(socket);
    if (!campaign) {
      if (typeof ack === "function") ack({ ok: false, error: "Not connected to a campaign." });
      return;
    }

    const value = Math.max(0, Number((payload && payload.value) || 0));
    const member = campaign.members.get(socket.id);
    campaign.shared.tmw = value;
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
    const member = campaign.members.get(socket.id);
    campaign.shared.tmw = next;
    addLog(campaign, "tmw", `${member ? member.name : "Someone"} changed Teamwork by ${delta > 0 ? "+" : ""}${delta} (now ${next}).`, { delta, value: next });
    emitCampaignState(campaign.code);

    if (typeof ack === "function") ack({ ok: true, value: next });
  });

  socket.on("campaign:rollRequest", (payload, ack) => {
    const campaign = getCampaignBySocket(socket);
    if (!campaign) {
      if (typeof ack === "function") ack({ ok: false, error: "Not connected to a campaign." });
      return;
    }

    if (campaign.gmSocketId !== socket.id) {
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

    const gm = campaign.members.get(socket.id);
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
    const member = campaign.members.get(socket.id) || { name: "Player", role: "player" };

    const existingIdx = campaign.activeRollRequest.responses.findIndex((resp) => resp.id === socket.id);
    const response = {
      id: socket.id,
      name: member.name,
      role: member.role,
      total,
      dreadTotal,
      die,
      success: total >= dreadTotal,
      at: Date.now()
    };

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

    if (campaign.gmSocketId !== socket.id) {
      if (typeof ack === "function") ack({ ok: false, error: "Only the GM can close roll requests." });
      return;
    }

    campaign.activeRollRequest = null;
    addLog(campaign, "roll", "GM closed the active roll request.");
    emitCampaignState(campaign.code);

    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("disconnect", () => {
    removeMember(socket);
  });
});

server.listen(PORT, () => {
  console.log(`BEYOND-THE-LIGHT campaign server running at http://localhost:${PORT}`);
});
