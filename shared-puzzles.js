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
      { title: "Caravan Knot", prompt: "How many corners does a hex have?", answer: "6" },
      { title: "Maze Step Count", mode: "maze", prompt: "Guide the runner from S to E. Walls block movement.", answer: "R-R-D-D-R", mazeLayout: ["S..#", "##.#", "...#", "##.E"] },
      { title: "Jigsaw Relay", prompt: "Jigsaw order puzzle: Arrange tiles in correct sentence order: [KEY] [THE] [TURN] [NOW]. Enter full sentence.", answer: "turn the key now" },
      { title: "Word Search Marker", prompt: "Word Search: Find the hidden word in row 'B R I D G E'. Enter the found word.", answer: "bridge" },
      { title: "Word Scramble", prompt: "Unscramble: GNAIATVE", answer: "navigate" },
      { title: "Mini Sudoku", mode: "sudoku", prompt: "Fill the 4x4 grid so each row, column, and 2x2 box contains 1-4.", sudokuPuzzle: [["1", "", "3", "4"], ["3", "4", "1", "2"], ["2", "1", "4", "3"], ["4", "3", "2", "1"]], sudokuSolution: [["1", "2", "3", "4"], ["3", "4", "1", "2"], ["2", "1", "4", "3"], ["4", "3", "2", "1"]] },
      { title: "Magic Square", prompt: "3x3 Magic Square sum is 15. Grid: 8 1 6 / 3 5 7 / 4 _ 2. Missing value?", answer: "9" }
    ],
    sea: [
      { title: "Tide Sequence", prompt: "Enter the next term: 2, 4, 8, 16, ?", answer: "32" },
      { title: "Chart Mark", prompt: "Type the nautical shorthand for North-East.", answer: "ne" },
      { title: "Sea Cryptogram", prompt: "Cryptogram (Caesar +1): TFB -> ?", answer: "sea" },
      { title: "Word Search Buoy", prompt: "Word Search row: A N C H O R. Enter the hidden word.", answer: "anchor" }
    ],
    galaxy: [
      { title: "Signal Relay", prompt: "Type the binary value of decimal 5.", answer: "101" },
      { title: "Star Vector", prompt: "How many primary axes does a hex grid use?", answer: "3" },
      { title: "Crossword Clue", prompt: "Crossword clue: 4 letters, " + '"Star path"' + " = ?", answer: "lane" },
      { title: "Word Scramble", prompt: "Unscramble: RTOIB", answer: "orbit" }
    ],
    planet: [
      { title: "Surface Lock", prompt: "Enter: BIO + ME = ?", answer: "biome" },
      { title: "Drill Code", prompt: "Solve: 9 + 7", answer: "16" },
      { title: "Mini Maze Route", mode: "maze", prompt: "Trace the rover's path through the cracked surface tunnels.", answer: "R-R-D-D-L-D", mazeLayout: ["S...", "###.", "..#.", "E..."] },
      { title: "Magic Square Delta", prompt: "Magic square line total is 15. Row: 2 7 _. Missing number?", answer: "6" }
    ],
    wtw: [
      { title: "District Relay", prompt: "Unscramble: RAILSTOANIT", answer: "railstation" },
      { title: "Control Pulse", prompt: "Solve: 12 - 5", answer: "7" },
      { title: "District Crossword", prompt: "Crossword clue: 5 letters, " + '"Urban train stop"' + " = ?", answer: "depot" },
      { title: "Cryptogram Grid", prompt: "Cryptogram (+1 shift): [XPSME]. Decode.", answer: "world" }
    ],
    task: [
      { title: "Field Brief", prompt: "Type the stat used most for exploration checks in this game section.", answer: "adventure" },
      { title: "Route Marker", prompt: "How many directions are shown in the 8-way observation controls?", answer: "8" },
      { title: "Jigsaw Brief", prompt: "Arrange phrase parts: [ROUTE] [THE] [HOLD] [LINE]. Enter full phrase.", answer: "hold the route line" }
    ],
    event: [
      { title: "Event Seal", prompt: "Type YES to stabilize the event flow.", answer: "yes" },
      { title: "Risk Matrix", prompt: "What die size is used for Dread checks in many quick tasks here?", answer: "6" },
      { title: "Word Search Event", prompt: "Word Search row: H A Z A R D. Enter the hidden word.", answer: "hazard" },
      { title: "Word Scramble", prompt: "Unscramble: VETNE", answer: "event" }
    ],
    holding: [
      { title: "Council Ledger", prompt: "Type the role that handles diplomacy in your council.", answer: "diplomat" },
      { title: "Home Registry", prompt: "Type HOME in uppercase.", answer: "HOME" },
      { title: "Mini Sudoku", mode: "sudoku", prompt: "Restore the council ledger grid so each row, column, and 2x2 box contains 1-4.", sudokuPuzzle: [["1", "2", "3", ""], ["3", "4", "", "2"], ["2", "", "4", "3"], ["", "3", "2", "1"]], sudokuSolution: [["1", "2", "3", "4"], ["3", "4", "1", "2"], ["2", "1", "4", "3"], ["4", "3", "2", "1"]] },
      { title: "Magic Square", prompt: "3x3 Magic Square row: 4 9 _. Target row sum 15. Missing number?", answer: "2" }
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

  function finishSharedPuzzle(success) {
    const st = ensurePuzzleState();
    if (!st || !st.active) return;
    const active = st.active;

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


  // ─── Custom inline puzzle modes ──────────────────────────────────────────
  var _cp = null;

  function buildPipeFlowState() {
    return {
      tiles: [
        { type: 'source',   rotation: 0, locked: true  },
        { type: 'straight', rotation: 1, locked: false },
        { type: 'elbow',    rotation: 0, locked: false },
        { type: 'block',    rotation: 0, locked: true  },
        { type: 'block',    rotation: 0, locked: true  },
        { type: 'straight', rotation: 0, locked: false },
        { type: 'block',    rotation: 0, locked: true  },
        { type: 'block',    rotation: 0, locked: true  },
        { type: 'sink',     rotation: 0, locked: true  }
      ]
    };
  }

  function _cpTileExits(tile) {
    var r = (tile.rotation || 0) % 4;
    if (tile.type === 'source') return ['right'];
    if (tile.type === 'sink')   return ['up'];
    if (tile.type === 'straight') return r % 2 === 0 ? ['left', 'right'] : ['up', 'down'];
    if (tile.type === 'elbow') {
      if (r === 0) return ['up', 'right'];
      if (r === 1) return ['right', 'down'];
      if (r === 2) return ['down', 'left'];
      return ['left', 'up'];
    }
    return [];
  }

  function _pipeFlowSolved(tiles) {
    var req = { 0: ['right'], 1: ['left', 'right'], 2: ['left', 'down'], 5: ['up', 'down'], 8: ['up'] };
    for (var i in req) {
      var exits = _cpTileExits(tiles[i]);
      var needed = req[i];
      for (var j = 0; j < needed.length; j++) {
        if (exits.indexOf(needed[j]) < 0) return false;
      }
    }
    return true;
  }

  function _renderPipeFlow(state, title, prompt) {
    var glyph = function(tile) {
      var r = (tile.rotation || 0) % 4;
      if (tile.type === 'source') return '\u25b6';
      if (tile.type === 'sink')   return '\u25b2';
      if (tile.type === 'straight') return r % 2 === 0 ? '\u2550' : '\u2551';
      if (tile.type === 'elbow') return ['\u255a', '\u2554', '\u2557', '\u255d'][r];
      return '\u00b7';
    };
    var solved = _pipeFlowSolved(state.tiles);
    return '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.16rem;"><strong>' + title + '</strong></div>'
      + '<div style="font-size:.65rem;color:var(--muted2);margin-bottom:.16rem;">' + prompt + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(3,68px);gap:.12rem;justify-content:center;margin-bottom:.18rem;">'
      + state.tiles.map(function(tile, idx) {
          var bg = tile.type === 'source' ? 'rgba(40,180,220,.22)' : tile.type === 'sink' ? 'rgba(255,190,70,.22)' : tile.locked ? 'rgba(20,20,30,.5)' : 'rgba(50,60,90,.5)';
          return '<button class="btn btn-xs" style="height:68px;font-size:1.7rem;line-height:1;background:' + bg + ';border-color:rgba(255,255,255,.18);"'
            + (tile.locked ? ' disabled' : ' onclick="window._cpAction(\'pipe_rotate\',' + idx + ')"')
            + '>' + glyph(tile) + '</button>';
        }).join('')
      + '</div>'
      + (solved ? '<div style="color:var(--teal);text-align:center;font-size:.75rem;margin-bottom:.1rem;">\u2713 Pipe flow connected!</div>' : '')
      + '<div style="display:flex;gap:.28rem;justify-content:flex-end;margin-top:.1rem;">'
      + '<button class="btn btn-sm" onclick="window._cpAction(\'give_up\')">Give Up</button>'
      + '<button class="btn btn-sm btn-primary"' + (solved ? '' : ' disabled') + ' onclick="window._cpAction(\'submit\')">Submit</button>'
      + '</div>';
  }

  function _initChess() {
    return {
      board: 5,
      rook: { r: 4, c: 0 },
      pawns: [{ r: 0, c: 0 }, { r: 0, c: 4 }, { r: 2, c: 2 }, { r: 4, c: 4 }],
      captured: []
    };
  }

  function _rookCanCapture(state, pawn) {
    var rook = state.rook;
    if (rook.r !== pawn.r && rook.c !== pawn.c) return false;
    var remaining = state.pawns.filter(function(p, i) { return state.captured.indexOf(i) < 0; });
    if (rook.r === pawn.r) {
      var minC = Math.min(rook.c, pawn.c), maxC = Math.max(rook.c, pawn.c);
      return !remaining.some(function(p) { return p !== pawn && p.r === rook.r && p.c > minC && p.c < maxC; });
    }
    var minR = Math.min(rook.r, pawn.r), maxR = Math.max(rook.r, pawn.r);
    return !remaining.some(function(p) { return p !== pawn && p.c === rook.c && p.r > minR && p.r < maxR; });
  }

  function _renderChess(state, title, prompt) {
    var N = state.board;
    var remaining = state.pawns.filter(function(_, i) { return state.captured.indexOf(i) < 0; });
    var solved = remaining.length === 0;
    var rows = '';
    for (var r = 0; r < N; r++) {
      for (var c = 0; c < N; c++) {
        var isRook = state.rook.r === r && state.rook.c === c;
        var pawnIdx = -1;
        state.pawns.forEach(function(p, i) { if (p.r === r && p.c === c && state.captured.indexOf(i) < 0) pawnIdx = i; });
        var bg = (r + c) % 2 === 0 ? 'rgba(80,80,90,.6)' : 'rgba(40,40,50,.6)';
        var content = isRook ? '\u265c' : (pawnIdx >= 0 ? '\u265f' : '');
        var canCapture = pawnIdx >= 0 && _rookCanCapture(state, state.pawns[pawnIdx]);
        var style = 'width:52px;height:52px;font-size:1.4rem;line-height:1;background:' + bg + ';border:1px solid rgba(255,255,255,.1);color:'
          + (isRook ? 'var(--teal)' : canCapture ? 'var(--gold2)' : 'var(--text2)') + ';';
        rows += '<button style="' + style + '"'
          + (canCapture ? ' onclick="window._cpAction(\'chess_capture\',' + pawnIdx + ')"' : ' disabled')
          + '>' + content + '</button>';
      }
    }
    return '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.16rem;"><strong>' + title + '</strong></div>'
      + '<div style="font-size:.65rem;color:var(--muted2);margin-bottom:.12rem;">' + prompt + '</div>'
      + '<div style="font-size:.64rem;color:var(--teal);margin-bottom:.1rem;">\u265c Rook (teal) \u265f Pawn (gold = capturable). Click gold pawns to capture. Rook moves in straight lines only.</div>'
      + '<div style="display:grid;grid-template-columns:repeat(' + N + ',52px);gap:2px;justify-content:center;margin-bottom:.16rem;">' + rows + '</div>'
      + (solved ? '<div style="color:var(--teal);text-align:center;font-size:.75rem;margin-bottom:.1rem;">\u2713 All pawns captured!</div>' : '<div style="font-size:.63rem;color:var(--muted2);text-align:center;margin-bottom:.1rem;">' + remaining.length + ' pawn(s) remaining</div>')
      + '<div style="display:flex;gap:.28rem;justify-content:flex-end;margin-top:.1rem;">'
      + '<button class="btn btn-sm" onclick="window._cpAction(\'give_up\')">Give Up</button>'
      + '<button class="btn btn-sm btn-primary"' + (solved ? '' : ' disabled') + ' onclick="window._cpAction(\'submit\')">Submit</button>'
      + '</div>';
  }

  function _initSliding() {
    return { tiles: [1, 2, 3, 4, 0, 6, 7, 5, 8], size: 3 };
  }

  function _slidingSolved(tiles) {
    var goal = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    return tiles.every(function(v, i) { return v === goal[i]; });
  }

  function _renderSliding(state, title, prompt) {
    var N = state.size;
    var blankIdx = state.tiles.indexOf(0);
    var solved = _slidingSolved(state.tiles);
    var grid = state.tiles.map(function(v, idx) {
      var isBlank = v === 0;
      var blankR = Math.floor(blankIdx / N), blankC = blankIdx % N;
      var r = Math.floor(idx / N), c = idx % N;
      var adjacent = Math.abs(r - blankR) + Math.abs(c - blankC) === 1;
      var bg = isBlank ? 'rgba(0,0,0,.1)' : 'rgba(60,80,120,.5)';
      return '<button class="btn btn-xs" style="width:58px;height:58px;font-size:1.1rem;background:' + bg + ';border-color:rgba(255,255,255,.2);"'
        + (isBlank ? ' disabled' : (!adjacent ? ' disabled' : ' onclick="window._cpAction(\'slide\',' + idx + ')"'))
        + '>' + (isBlank ? '' : v) + '</button>';
    }).join('');
    return '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.16rem;"><strong>' + title + '</strong></div>'
      + '<div style="font-size:.65rem;color:var(--muted2);margin-bottom:.12rem;">' + prompt + '</div>'
      + '<div style="font-size:.64rem;color:var(--teal);margin-bottom:.1rem;">Click tiles adjacent to the blank to slide them. Goal: 1\u20138, blank at bottom-right.</div>'
      + '<div style="display:grid;grid-template-columns:repeat(' + N + ',58px);gap:4px;justify-content:center;margin-bottom:.16rem;">' + grid + '</div>'
      + (solved ? '<div style="color:var(--teal);text-align:center;font-size:.75rem;margin-bottom:.1rem;">\u2713 Puzzle solved!</div>' : '')
      + '<div style="display:flex;gap:.28rem;justify-content:flex-end;margin-top:.1rem;">'
      + '<button class="btn btn-sm" onclick="window._cpAction(\'give_up\')">Give Up</button>'
      + '<button class="btn btn-sm btn-primary"' + (solved ? '' : ' disabled') + ' onclick="window._cpAction(\'submit\')">Submit</button>'
      + '</div>';
  }

  function _initMathGrid() {
    return {
      equations: [
        { a: 9, op: '+', b: '?', result: 12, answer: 3 },
        { a: '?', op: '+', b: 4, result: 11, answer: 7 },
        { a: 15, op: '-', b: '?', result: 8, answer: 7 }
      ],
      inputs: ['', '', '']
    };
  }

  function _mathGridSolved(state) {
    return state.equations.every(function(eq, i) {
      return parseInt(state.inputs[i], 10) === eq.answer;
    });
  }

  function _renderMathGrid(state, title, prompt) {
    var solved = _mathGridSolved(state);
    var rows = state.equations.map(function(eq, i) {
      var inputHtml = '<input id="mathIn' + i + '" class="input" type="number" value="' + (state.inputs[i] || '') + '" oninput="window._cpAction(\'math_input\',' + i + ',this.value)" style="width:44px;height:28px;text-align:center;display:inline-block;padding:.08rem .1rem;font-size:.84rem;" />';
      var lhs = eq.a === '?' ? inputHtml : String(eq.a);
      var rhs = eq.b === '?' ? inputHtml : String(eq.b);
      var correct = parseInt(state.inputs[i], 10) === eq.answer;
      return '<div style="display:flex;align-items:center;gap:.45rem;font-size:.9rem;color:var(--text2);padding:.22rem .3rem;border:1px solid ' + (correct ? 'rgba(46,196,182,.5)' : 'rgba(255,255,255,.1)') + ';background:rgba(255,255,255,.03);margin-bottom:.1rem;">'
        + lhs + ' <span style="color:var(--gold2);">' + String(eq.op) + '</span> ' + rhs + ' <span style="color:var(--muted2);"> = </span> <strong>' + String(eq.result) + '</strong>'
        + (correct ? ' <span style="color:var(--teal);font-size:.7rem;">\u2713</span>' : '')
        + '</div>';
    }).join('');
    return '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.16rem;"><strong>' + title + '</strong></div>'
      + '<div style="font-size:.65rem;color:var(--muted2);margin-bottom:.12rem;">' + prompt + '</div>'
      + '<div style="font-size:.64rem;color:var(--teal);margin-bottom:.1rem;">Fill each missing number (?) so the equation is correct.</div>'
      + '<div style="max-width:280px;margin:0 auto .18rem;">' + rows + '</div>'
      + (solved ? '<div style="color:var(--teal);text-align:center;font-size:.75rem;margin-bottom:.1rem;">\u2713 All equations solved!</div>' : '')
      + '<div style="display:flex;gap:.28rem;justify-content:flex-end;margin-top:.1rem;">'
      + '<button class="btn btn-sm" onclick="window._cpAction(\'give_up\')">Give Up</button>'
      + '<button class="btn btn-sm btn-primary"' + (solved ? '' : ' disabled') + ' onclick="window._cpAction(\'submit\')">Submit</button>'
      + '</div>';
  }

  function _initRotatingImage() {
    return {
      segments: [
        { label: 'NW Shard', rot: 1 },
        { label: 'NE Shard', rot: 2 },
        { label: 'SW Shard', rot: 3 },
        { label: 'SE Shard', rot: 1 }
      ]
    };
  }

  function _rotatingImageSolved(state) {
    return state.segments.every(function(s) { return s.rot === 0; });
  }

  function _renderRotatingImage(state, title, prompt) {
    var solved = _rotatingImageSolved(state);
    var rotLabels = ['\u2191 Upright', '\u2192 90\u00b0 CW', '\u2193 180\u00b0', '\u2190 270\u00b0 CW'];
    var icons = ['\u25e4', '\u25e5', '\u25e3', '\u25e2'];
    var segGrid = state.segments.map(function(seg, i) {
      var correct = seg.rot === 0;
      var display = icons[(i + seg.rot) % 4];
      return '<div style="border:1px solid ' + (correct ? 'rgba(46,196,182,.5)' : 'rgba(255,255,255,.14)') + ';padding:.3rem;background:rgba(255,255,255,.04);text-align:center;">'
        + '<div style="font-size:2.2rem;color:var(--text2);margin-bottom:.1rem;">' + display + '</div>'
        + '<div style="font-size:.6rem;color:var(--muted2);margin-bottom:.12rem;">' + seg.label + '<br>' + rotLabels[seg.rot] + '</div>'
        + '<button class="btn btn-xs' + (correct ? '' : ' btn-primary') + '" onclick="window._cpAction(\'rotate_seg\',' + i + ')">' + (correct ? '\u2713 Aligned' : 'Rotate \u21bb') + '</button>'
        + '</div>';
    }).join('');
    return '<div style="font-size:.72rem;color:var(--gold2);margin-bottom:.16rem;"><strong>' + title + '</strong></div>'
      + '<div style="font-size:.65rem;color:var(--muted2);margin-bottom:.12rem;">' + prompt + '</div>'
      + '<div style="font-size:.64rem;color:var(--teal);margin-bottom:.1rem;">Rotate each shard so all four show \u2191 Upright.</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.2rem;max-width:300px;margin:0 auto .2rem;">' + segGrid + '</div>'
      + (solved ? '<div style="color:var(--teal);text-align:center;font-size:.75rem;margin-bottom:.1rem;">\u2713 Image restored!</div>' : '')
      + '<div style="display:flex;gap:.28rem;justify-content:flex-end;margin-top:.1rem;">'
      + '<button class="btn btn-sm" onclick="window._cpAction(\'give_up\')">Give Up</button>'
      + '<button class="btn btn-sm btn-primary"' + (solved ? '' : ' disabled') + ' onclick="window._cpAction(\'submit\')">Submit</button>'
      + '</div>';
  }

  function _renderCustomPuzzle() {
    if (!_cp) return;
    var s = _cp.state;
    var t = _cp.title || 'Puzzle';
    var p = _cp.prompt || 'Solve the puzzle.';
    var html = '';
    if (_cp.mode === 'pipe_flow')        html = _renderPipeFlow(s, t, p);
    else if (_cp.mode === 'chess_puzzle')  html = _renderChess(s, t, p);
    else if (_cp.mode === 'sliding_tile')  html = _renderSliding(s, t, p);
    else if (_cp.mode === 'math_grid')     html = _renderMathGrid(s, t, p);
    else if (_cp.mode === 'rotating_image') html = _renderRotatingImage(s, t, p);
    if (typeof openModal === 'function') openModal(t, html);
  }

  window._cpAction = function(action, arg1, arg2) {
    if (!_cp) return;
    var s = _cp.state;
    if (action === 'give_up') {
      _cp = null;
      if (typeof closeModal === 'function') closeModal();
      finishSharedPuzzle(false);
      return;
    }
    if (action === 'submit') {
      _cp = null;
      if (typeof closeModal === 'function') closeModal();
      finishSharedPuzzle(true);
      return;
    }
    if (action === 'pipe_rotate') {
      var idx = Number(arg1);
      if (s.tiles[idx] && !s.tiles[idx].locked) s.tiles[idx].rotation = ((s.tiles[idx].rotation || 0) + 1) % 4;
      _renderCustomPuzzle(); return;
    }
    if (action === 'chess_capture') {
      var pIdx = Number(arg1);
      var pawn = s.pawns[pIdx];
      if (_rookCanCapture(s, pawn)) {
        s.captured.push(pIdx);
        s.rook = { r: pawn.r, c: pawn.c };
      }
      _renderCustomPuzzle(); return;
    }
    if (action === 'slide') {
      var tIdx = Number(arg1);
      var blankIdx = s.tiles.indexOf(0);
      var N = s.size;
      var tr2 = Math.floor(tIdx / N), tc2 = tIdx % N;
      var br2 = Math.floor(blankIdx / N), bc2 = blankIdx % N;
      if (Math.abs(tr2 - br2) + Math.abs(tc2 - bc2) === 1) {
        var tmp = s.tiles[tIdx]; s.tiles[tIdx] = 0; s.tiles[blankIdx] = tmp;
      }
      _renderCustomPuzzle(); return;
    }
    if (action === 'math_input') {
      s.inputs[Number(arg1)] = String(arg2 || '');
      _renderCustomPuzzle(); return;
    }
    if (action === 'rotate_seg') {
      s.segments[Number(arg1)].rot = (s.segments[Number(arg1)].rot + 1) % 4;
      _renderCustomPuzzle(); return;
    }
  };

  var CUSTOM_PUZZLE_MODES = ['pipe_flow', 'chess_puzzle', 'sliding_tile', 'math_grid', 'rotating_image'];

  function openSharedPuzzleChallenge(config) {
    const st = ensurePuzzleState();
    if (!st) return false;

    const source = String((config && config.source) || "event").toLowerCase();
    const pool = PUZZLES[source] || PUZZLES.event;
    const chosen = Object.assign({}, safePick(pool, pool[0]));
    if (config && config.mode) chosen.mode = String(config.mode);
    if (config && Array.isArray(config.gridTemplate)) chosen.gridTemplate = config.gridTemplate.slice();
    if (config && Array.isArray(config.clues)) chosen.clues = config.clues.slice();
    if (config && Array.isArray(config.sudokuPuzzle)) chosen.sudokuPuzzle = config.sudokuPuzzle;
    if (config && Array.isArray(config.sudokuSolution)) chosen.sudokuSolution = config.sudokuSolution;
    if (config && Array.isArray(config.mazeLayout)) chosen.mazeLayout = config.mazeLayout;
    const title = (config && config.title) || chosen.title || "Shared Puzzle";
    const prompt = (config && config.prompt) || chosen.prompt || "Solve the prompt.";
    const answer = normalizeAnswer((config && config.answer) || chosen.answer || "");
    const reward = Object.assign({ credits: 30, renown: 0, item: "Puzzle Token" }, (config && config.reward) || {});

    st.active = {
      source: source,
      answer: answer,
      reward: reward,
      onSuccess: config ? config.onSuccess : null,
      onFail: config ? config.onFail : null,
      mode: chosen.mode || ''
    };

    if (chosen.mode && CUSTOM_PUZZLE_MODES.indexOf(chosen.mode) >= 0) {
      _cp = {
        mode: chosen.mode,
        title: title,
        prompt: prompt,
        state: chosen.mode === 'pipe_flow' ? buildPipeFlowState()
          : chosen.mode === 'chess_puzzle' ? _initChess()
          : chosen.mode === 'sliding_tile' ? _initSliding()
          : chosen.mode === 'math_grid' ? _initMathGrid()
          : _initRotatingImage()
      };
      _renderCustomPuzzle();
      return true;
    }

    if (chosen.mode && typeof window.openStandaloneStoryPuzzle === "function") {
      window.openStandaloneStoryPuzzle({
        mode: chosen.mode,
        title: title,
        prompt: prompt,
        answer: answer,
        clues: chosen.clues,
        gridTemplate: chosen.gridTemplate,
        mazeLayout: chosen.mazeLayout,
        sudokuPuzzle: chosen.sudokuPuzzle,
        sudokuSolution: chosen.sudokuSolution,
        thresholdLabel: 'Shared Puzzle',
        successThreshold: 0.7,
        partialThreshold: 0.45,
        onResolve: function (result) {
          finishSharedPuzzle(result === 'success' || result === 'partial');
        }
      });
      return true;
    }

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
    finishSharedPuzzle(success);
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
