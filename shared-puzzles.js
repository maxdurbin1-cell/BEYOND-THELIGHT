// shared-puzzles.js
(function () {
  function safeRoll(max) {
    if (typeof roll === "function") return roll(max);
    return Math.floor(Math.random() * max) + 1;
  }

  function safePick(list, fallback) {
    if (!Array.isArray(list) || !list.length) return fallback;
    if (typeof pick === "function") return pick(list);
    return list[Math.floor(Math.random() * list.length)];
  }

  function ensurePuzzleState() {
    if (typeof S === "undefined") return null;
    S.sharedPuzzles = S.sharedPuzzles || {
      solved: 0,
      failed: 0,
      bySource: {},
      active: null
    };
    return S.sharedPuzzles;
  }

  const PUZZLES = {
    province: [
      { title: "Road Cipher", prompt: "Decode and enter: BRIDGE -> ? (Hint: reverse it)", answer: "egdirb" },
      { title: "Caravan Knot", prompt: "How many corners does a hex have?", answer: "6" }
    ],
    sea: [
      { title: "Tide Sequence", prompt: "Enter the next term: 2, 4, 8, 16, ?", answer: "32" },
      { title: "Chart Mark", prompt: "Type the nautical shorthand for North-East.", answer: "ne" }
    ],
    galaxy: [
      { title: "Signal Relay", prompt: "Type the binary value of decimal 5.", answer: "101" },
      { title: "Star Vector", prompt: "How many primary axes does a hex grid use?", answer: "3" }
    ],
    planet: [
      { title: "Surface Lock", prompt: "Enter: BIO + ME = ?", answer: "biome" },
      { title: "Drill Code", prompt: "Solve: 9 + 7", answer: "16" }
    ],
    wtw: [
      { title: "District Relay", prompt: "Unscramble: RAILSTOANIT", answer: "railstation" },
      { title: "Control Pulse", prompt: "Solve: 12 - 5", answer: "7" }
    ],
    task: [
      { title: "Field Brief", prompt: "Type the stat used most for exploration checks in this game section.", answer: "adventure" },
      { title: "Route Marker", prompt: "How many directions are shown in the 8-way observation controls?", answer: "8" }
    ],
    event: [
      { title: "Event Seal", prompt: "Type YES to stabilize the event flow.", answer: "yes" },
      { title: "Risk Matrix", prompt: "What die size is used for Dread checks in many quick tasks here?", answer: "6" }
    ],
    holding: [
      { title: "Council Ledger", prompt: "Type the role that handles diplomacy in your council.", answer: "diplomat" },
      { title: "Home Registry", prompt: "Type HOME in uppercase.", answer: "HOME" }
    ]
  };

  function normalizeAnswer(v) {
    return String(v || "").trim().toLowerCase();
  }

  function applyPuzzleReward(source, reward) {
    if (typeof S === "undefined") return;
    const credits = Number((reward && reward.credits) || 0);
    const renown = Number((reward && reward.renown) || 0);
    const item = reward && reward.item ? String(reward.item) : "";

    if (credits) {
      S.credits = Math.max(0, Number(S.credits || 0) + credits);
      if (typeof updateCreditsUI === "function") updateCreditsUI();
    }
    if (renown) {
      if (typeof changeCounter === "function") changeCounter("renown", renown);
      else S.renown = Math.max(0, Number(S.renown || 0) + renown);
    }
    if (item && typeof addToBackpack === "function") {
      try { addToBackpack(item); } catch (err) {}
    }

    if (typeof showNotif === "function") {
      const bits = [];
      if (credits) bits.push("+" + credits + " Credits");
      if (renown) bits.push("+" + renown + " Renown");
      if (item) bits.push("Loot: " + item);
      showNotif("Puzzle reward (" + source + "): " + bits.join(" · "), "good");
    }
  }

  function resolveCallback(cb) {
    if (!cb) return null;
    if (typeof cb === "function") return cb;
    if (typeof cb === "string" && typeof window[cb] === "function") return window[cb];
    return null;
  }

  function openSharedPuzzleChallenge(config) {
    const st = ensurePuzzleState();
    if (!st) return false;

    const source = String((config && config.source) || "event").toLowerCase();
    const pool = PUZZLES[source] || PUZZLES.event;
    const chosen = Object.assign({}, safePick(pool, pool[0]));
    const title = (config && config.title) || chosen.title || "Shared Puzzle";
    const prompt = (config && config.prompt) || chosen.prompt || "Solve the prompt.";
    const answer = normalizeAnswer((config && config.answer) || chosen.answer || "");
    const reward = Object.assign({ credits: 30, renown: 0, item: "Puzzle Token" }, (config && config.reward) || {});

    st.active = {
      source: source,
      answer: answer,
      reward: reward,
      onSuccess: config ? config.onSuccess : null,
      onFail: config ? config.onFail : null
    };

    const html = ""
      + "<div style='font-size:.84rem;color:var(--text2);line-height:1.6;margin-bottom:.4rem;'>"
      + "<strong style='color:var(--gold2);'>" + title + "</strong><br>"
      + prompt
      + "</div>"
      + "<input id='sharedPuzzleInput' class='input' placeholder='Enter answer' style='width:100%;margin-bottom:.45rem;'/>"
      + "<div style='display:flex;gap:.35rem;justify-content:flex-end;'>"
      + "<button class='btn btn-sm' onclick='resolveSharedPuzzle(false)'>Skip</button>"
      + "<button class='btn btn-sm btn-primary' onclick='resolveSharedPuzzle(true)'>Submit</button>"
      + "</div>";

    if (typeof openModal === "function") openModal("Shared Puzzle", html);
    return true;
  }

  function resolveSharedPuzzle(submit) {
    const st = ensurePuzzleState();
    if (!st || !st.active) return;
    const active = st.active;

    let success = false;
    if (submit) {
      const el = document.getElementById("sharedPuzzleInput");
      const typed = normalizeAnswer(el && typeof el.value === "string" ? el.value : "");
      success = typed === active.answer;
    }

    if (typeof closeModal === "function") closeModal();

    st.bySource[active.source] = st.bySource[active.source] || { solved: 0, failed: 0 };

    if (success) {
      st.solved += 1;
      st.bySource[active.source].solved += 1;
      applyPuzzleReward(active.source, active.reward);
      const okFn = resolveCallback(active.onSuccess);
      if (okFn) {
        try { okFn(); } catch (err) {}
      }
    } else {
      st.failed += 1;
      st.bySource[active.source].failed += 1;
      if (typeof addTMWOnFail === "function") addTMWOnFail();
      if (typeof showNotif === "function") showNotif("Puzzle failed (" + active.source + ").", "warn");
      const failFn = resolveCallback(active.onFail);
      if (failFn) {
        try { failFn(); } catch (err) {}
      }
    }

    st.active = null;
  }

  function maybeSpawnSharedPuzzle(source, chance, reward) {
    if (safeRoll(100) > Math.max(1, Math.min(100, Number(chance || 35)))) return false;
    return openSharedPuzzleChallenge({ source: source, reward: reward || {} });
  }

  function patchFunction(name, wrapper) {
    const fn = window[name];
    if (typeof fn !== "function") return;
    if (window["__sharedPuzzlePatched_" + name]) return;
    window["__sharedPuzzlePatched_" + name] = true;
    window[name] = function () {
      const args = Array.prototype.slice.call(arguments);
      const out = fn.apply(this, args);
      try { wrapper(args, out); } catch (err) {}
      return out;
    };
  }

  function patchAll() {
    patchFunction("completeEventChallenge", function () {
      maybeSpawnSharedPuzzle("province", 40, { credits: 35, renown: 1, item: "Province Puzzle Cache" });
    });
    patchFunction("resolveEventAction", function () {
      maybeSpawnSharedPuzzle("event", 30, { credits: 25, item: "Event Cipher" });
    });
    patchFunction("resolveEventLeadAction", function () {
      maybeSpawnSharedPuzzle("event", 30, { credits: 25, item: "Lead Brief" });
    });
    patchFunction("completeSeaTask", function () {
      maybeSpawnSharedPuzzle("sea", 45, { credits: 45, renown: 1, item: "Sea Relic Shard" });
    });
    patchFunction("resolveGalaxyTaskOutcome", function (args) {
      if (args[1] === true) maybeSpawnSharedPuzzle("galaxy", 45, { credits: 50, renown: 1, item: "Star Cipher" });
    });
    patchFunction("resolvePlanetTask", function (args) {
      if (args[1] === true) maybeSpawnSharedPuzzle("planet", 45, { credits: 45, renown: 1, item: "Planet Cache" });
    });
    patchFunction("resolveZoneEvent", function () {
      maybeSpawnSharedPuzzle("wtw", 35, { credits: 40, renown: 1, item: "District Puzzle Key" });
    });
    patchFunction("resolveDistrictEncounter", function () {
      maybeSpawnSharedPuzzle("wtw", 30, { credits: 30, item: "Encounter Fragment" });
    });
    patchFunction("completeHoldingTask", function () {
      maybeSpawnSharedPuzzle("task", 35, { credits: 40, renown: 1, item: "Task Cipher" });
    });
    patchFunction("completeTaskAtHex", function () {
      maybeSpawnSharedPuzzle("task", 35, { credits: 30, renown: 1, item: "Province Task Seal" });
    });
    patchFunction("completeRoyalTask", function () {
      maybeSpawnSharedPuzzle("task", 40, { credits: 35, renown: 1, item: "Royal Writ" });
    });
    patchFunction("onHoldingCouncilTaskResolved", function (args) {
      if (args[1] === true) maybeSpawnSharedPuzzle("holding", 45, { credits: 50, renown: 1, item: "Council Charter" });
    });
  }

  window.openSharedPuzzleChallenge = openSharedPuzzleChallenge;
  window.resolveSharedPuzzle = resolveSharedPuzzle;
  window.maybeSpawnSharedPuzzle = maybeSpawnSharedPuzzle;

  patchAll();
})();
