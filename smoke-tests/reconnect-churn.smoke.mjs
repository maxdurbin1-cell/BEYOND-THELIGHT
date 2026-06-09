import { io } from "socket.io-client";

const BASE_URL = String(process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").trim();
const ITERATIONS = Math.max(5, Number(process.env.SMOKE_RECONNECT_ITERATIONS || 30));
const JOIN_TIMEOUT_MS = Math.max(2000, Number(process.env.SMOKE_RECONNECT_TIMEOUT_MS || 7000));

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectClient(label) {
  const socket = io(BASE_URL, {
    transports: ["websocket"],
    forceNew: true,
    timeout: JOIN_TIMEOUT_MS,
    reconnection: false
  });
  socket.__label = label;
  return socket;
}

function onceConnected(socket, timeoutMs = JOIN_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`${socket.__label || "socket"} connect timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.once("connect", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    });

    socket.once("connect_error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`${socket.__label || "socket"} connect_error: ${err && err.message ? err.message : err}`));
    });
  });
}

function emitAck(socket, eventName, payload, timeoutMs = JOIN_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`${socket.__label || "socket"} ${eventName} ack timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      socket.emit(eventName, payload || {}, (res) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(res || null);
      });
    } catch (err) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    }
  });
}

async function main() {
  console.log(`[reconnect-soak] starting against ${BASE_URL}`);
  console.log(`[reconnect-soak] iterations=${ITERATIONS}`);

  const gm = connectClient("gm");
  await onceConnected(gm);

  const createRes = await emitAck(gm, "campaign:create", { name: "Soak GM" });
  if (!createRes || !createRes.ok || !createRes.code || !createRes.token) {
    throw new Error(`campaign:create failed: ${JSON.stringify(createRes)}`);
  }

  const code = String(createRes.code);
  const gmToken = String(createRes.token);
  console.log(`[reconnect-soak] campaign ${code} created`);

  let player = connectClient("player-initial");
  await onceConnected(player);
  const joinRes = await emitAck(player, "campaign:join", {
    code,
    role: "player",
    name: "Soak Player"
  });
  if (!joinRes || !joinRes.ok || !joinRes.token) {
    throw new Error(`initial campaign:join failed: ${JSON.stringify(joinRes)}`);
  }
  const playerToken = String(joinRes.token);

  for (let i = 0; i < ITERATIONS; i += 1) {
    const cycle = i + 1;
    if (player && player.connected) {
      player.disconnect();
    }
    await delay(35);

    player = connectClient(`player-${cycle}`);
    await onceConnected(player);

    const restoredJoin = await emitAck(player, "campaign:join", {
      code,
      role: "player",
      name: "Soak Player",
      token: playerToken
    });

    if (!restoredJoin || !restoredJoin.ok) {
      throw new Error(`cycle ${cycle} join failed: ${JSON.stringify(restoredJoin)}`);
    }
    if (!restoredJoin.restored) {
      throw new Error(`cycle ${cycle} expected restored=true, got ${JSON.stringify(restoredJoin)}`);
    }

    const resync = await emitAck(player, "campaign:requestResync", {});
    if (!resync || !resync.ok) {
      throw new Error(`cycle ${cycle} requestResync failed: ${JSON.stringify(resync)}`);
    }

    if (cycle % 5 === 0 || cycle === ITERATIONS) {
      console.log(`[reconnect-soak] cycle ${cycle}/${ITERATIONS} ok`);
    }
  }

  const deleteRes = await emitAck(gm, "campaign:delete", { code, token: gmToken });
  if (!deleteRes || !deleteRes.ok) {
    throw new Error(`campaign:delete failed: ${JSON.stringify(deleteRes)}`);
  }

  if (player) player.disconnect();
  gm.disconnect();
  console.log("[reconnect-soak] PASS");
}

main().catch((err) => {
  console.error("[reconnect-soak] FAIL", err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
