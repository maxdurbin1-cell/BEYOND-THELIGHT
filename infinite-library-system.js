// infinite-library-system.js
(function () {
  function rngFromSeed(seed) {
    var h = 2166136261;
    var s = String(seed || 'library');
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return function () {
      h += 0x6D2B79F5;
      var t = Math.imul(h ^ (h >>> 15), 1 | h);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rollDie(max) {
    if (typeof roll === 'function') return roll(max);
    return 1 + Math.floor(Math.random() * max);
  }

  function statDie(stat) {
    if (typeof getEffectiveDie === 'function') return Math.max(4, Number(getEffectiveDie(stat) || 4));
    if (typeof getStat === 'function') return Math.max(4, Number(getStat(stat) || 4));
    return 6;
  }

  var LIBRARY_TIERS = [
    { die: 4, label: 'Index Vault', theme: 'catalog ladders, whisper-lanterns, librarian masks', boss: 'The Card Keeper' },
    { die: 6, label: 'Sewer Codex', theme: 'dripping culverts, chained folios, salt ink', boss: 'The Drain Scribe' },
    { die: 8, label: 'Underdark Stacks', theme: 'fungal vellum, blind script, basalt shelves', boss: 'The Blind Cartographer' },
    { die: 10, label: 'Astral Annex', theme: 'floating bindings, static pages, impossible shelf angles', boss: 'The Comet Archivist' },
    { die: 12, label: 'Broken Parliament', theme: 'forbidden decrees, vote-ledgers, hollow gavels', boss: 'The Last Clerk' },
    { die: 20, label: 'Infinite Crown Floor', theme: 'recurring hexagons, mirrored ink, recursive corridors', boss: 'The Endless Curator' }
  ];

  var ROOM_SNIPPETS = {
    4: [
      'A low gallery of brass ladders and numbered alcoves smells of glue and old rain.',
      'Index ribbons flutter from a draft with no visible source; each points somewhere else.',
      'A reading desk repeats every twelve paces, each copy with a different unfinished sentence.'
    ],
    6: [
      'Black water moves beneath iron grates while waterproof codices hang from hooks.',
      'Scribes in waxed aprons scrape mildew from chapter spines and never look up.',
      'Drain maps overlap with family trees; both end in the same locked chamber.'
    ],
    8: [
      'Mushroom light pulses between carved shelves where stone tablets sit beside paper books.',
      'The floor dips around root-bound lecterns, each carved in a language you almost remember.',
      'A collapsed aisle reveals an older aisle beneath it, still organized by an extinct alphabet.'
    ],
    10: [
      'Shelf rings orbit a silent core, books drifting between them like slow satellites.',
      'Your footsteps echo a second late, as though another reader follows your route.',
      'Ink motes rise from open pages and collect into constellations overhead.'
    ],
    12: [
      'Debate transcripts are chained to podiums, amended in seven competing hands.',
      'Civic laws are shelved beside confessions and battlefield weather reports.',
      'A council chamber of empty chairs listens while you turn each page.'
    ],
    20: [
      'Every corridor branches into six, each with the same door and different dust.',
      'You find a book titled with your name; its first page describes this room exactly.',
      'Hexagonal balconies stack into darkness while distant readers whisper your questions back.'
    ]
  };

  // Original lore micro-texts inspired by public-domain-era motifs, not direct quotations.
  var BOOK_MICRO_SNIPPETS = [
    'A margin note claims the oldest roads were first measured by eclipse shadows, not by miles.',
    'An unsigned preface argues that every empire fails twice: once in law, once in memory.',
    'A sailor\'s ledger says the Sea Region tides still obey bells that sank centuries ago.',
    'One chapter insists the Province map redraws itself whenever three rival banners burn in one night.',
    'A field manual states that fear spreads faster than armies, but slower than rumor.',
    'A dry botanical index marks one flower as "edible only after confession."',
    'An anonymous tract lists seven names for winter and none for peace.',
    'A scavenger diary describes seeing the same moon from two districts at once.',
    'A war report suggests the first citadel was built to protect an archive, not a throne.',
    'A pilgrim note says every true oath leaves ash on the tongue for a day.'
  ];

  function ensureLibraryState() {
    if (typeof S === 'undefined' || !S) return null;
    if (!S.infiniteLibrary || typeof S.infiniteLibrary !== 'object') {
      S.infiniteLibrary = {
        active: false,
        depth: 1,
        roomIndex: 0,
        interactions: 0,
        sinceRoll: 0,
        bossDefeatedByTier: {},
        currentQuest: null,
        lastResult: ''
      };
    }
    return S.infiniteLibrary;
  }

  function tierForDepth(depth) {
    var idx = Math.max(0, Math.min(LIBRARY_TIERS.length - 1, Math.floor((Math.max(1, Number(depth || 1)) - 1) / 3)));
    return LIBRARY_TIERS[idx];
  }

  function pick(list, seed) {
    if (!Array.isArray(list) || !list.length) return '';
    var rng = rngFromSeed(seed);
    return list[Math.floor(rng() * list.length)] || list[0];
  }

  function buildQuest(state, tier) {
    var patrons = ['a widow from Ashline Ward', 'a caravan oath-keeper', 'a novice archivist', 'a masked magistrate courier'];
    var tasks = [
      'recover the red ledger from the flooded index',
      'copy the final line of the 9th bridge chronicle',
      'find who erased the seal from shelf hex 6-3',
      'verify the true date of the Brass Uprising'
    ];
    return {
      patron: pick(patrons, 'p:' + state.depth + ':' + tier.die),
      objective: pick(tasks, 't:' + state.depth + ':' + tier.die),
      reward: '+' + (40 + (tier.die * 4)) + ' Credits · +1 Renown'
    };
  }

  function maybeBossRoom(state, tier) {
    return (state.roomIndex > 0 && state.roomIndex % 4 === 0 && !state.bossDefeatedByTier[String(tier.die)]);
  }

  function renderLibraryModal() {
    var state = ensureLibraryState();
    if (!state || typeof openModal !== 'function') return false;
    state.active = true;
    var tier = tierForDepth(state.depth);
    var roomText = pick(ROOM_SNIPPETS[tier.die], 'room:' + state.depth + ':' + state.roomIndex);
    var bookText = pick(BOOK_MICRO_SNIPPETS, 'book:' + state.depth + ':' + state.roomIndex);
    if (!state.currentQuest) state.currentQuest = buildQuest(state, tier);
    var quest = state.currentQuest;
    var bossNow = maybeBossRoom(state, tier);

    var html = '<div style="font-size:.82rem;color:var(--text2);line-height:1.58;">'
      + '<div style="font-size:.9rem;color:var(--gold2);margin-bottom:.14rem;"><strong>The Infinite Library · Depth ' + Number(state.depth || 1) + '</strong></div>'
      + '<div style="font-size:.7rem;color:var(--teal);margin-bottom:.12rem;">Tier d' + tier.die + ' · ' + tier.label + ' · ' + tier.theme + '</div>'
      + '<div style="margin-bottom:.14rem;">' + roomText + '</div>'
      + '<div style="font-size:.72rem;color:var(--muted2);font-style:italic;margin-bottom:.16rem;">Book fragment: ' + bookText + '</div>'
      + '<div style="border:1px solid var(--border2);background:rgba(255,255,255,.03);padding:.2rem .28rem;margin-bottom:.14rem;">'
      + '<div style="font-size:.68rem;color:var(--gold2);margin-bottom:.08rem;"><strong>Contract Request</strong></div>'
      + '<div style="font-size:.66rem;color:var(--muted2);">' + quest.patron + ' asks you to ' + quest.objective + '. Reward: ' + quest.reward + '.</div>'
      + '</div>'
      + (bossNow
        ? ('<div style="font-size:.68rem;color:var(--red2);margin-bottom:.14rem;"><strong>Boss Gate:</strong> ' + tier.boss + ' blocks the next descent.</div>')
        : '')
      + (state.lastResult ? ('<div style="font-size:.66rem;color:var(--teal);margin-bottom:.14rem;">Last Result: ' + state.lastResult + '</div>') : '')
      + '<div style="display:flex;gap:.24rem;flex-wrap:wrap;">'
      + '<button class="btn btn-sm btn-primary" onclick="resolveInfiniteLibraryAction(\'search\')">Search Stacks (Mind vs d' + tier.die + ')</button>'
      + '<button class="btn btn-sm" onclick="resolveInfiniteLibraryAction(\'trace\')">Trace Spiral Route (Adventure vs d' + tier.die + ')</button>'
      + (bossNow
        ? '<button class="btn btn-sm btn-red" onclick="resolveInfiniteLibraryAction(\'boss\')">Confront ' + tier.boss + '</button>'
        : '<button class="btn btn-sm btn-teal" onclick="resolveInfiniteLibraryAction(\'descend\')">Descend To Next Room</button>')
      + '</div>'
      + '</div>';
    openModal('Infinite Library', html);
    return true;
  }

  function applyFailureConsequence(action) {
    if (typeof S === 'undefined' || !S) return;
    if (typeof addTMWOnFail === 'function') addTMWOnFail();
    if (action === 'search') {
      S.mentalStress = Math.max(0, Number(S.mentalStress || 0) + 2);
    } else {
      S.health = Math.max(0, Number(S.health || 0) - 2);
    }
  }

  function resolveInfiniteLibraryAction(action) {
    var state = ensureLibraryState();
    if (!state) return false;
    var tier = tierForDepth(state.depth);
    var risky = action === 'search' || action === 'trace' || action === 'boss';

    // Force at least one risk roll every 2-3 interactions.
    if (!risky && state.sinceRoll >= 2) risky = true;

    var success = true;
    var detail = '';
    if (risky) {
      var stat = action === 'search' ? 'mind' : (action === 'boss' ? 'strike' : 'adventure');
      var aDie = statDie(stat);
      var a = rollDie(aDie);
      var d = rollDie(tier.die);
      success = a >= d;
      state.sinceRoll = 0;
      detail = stat + ' d' + aDie + '=' + a + ' vs d' + tier.die + '=' + d;
      if (!success) applyFailureConsequence(action);
    } else {
      state.sinceRoll += 1;
      detail = 'No risk roll needed this beat.';
    }

    state.interactions += 1;
    if (success) {
      if (action === 'boss') {
        state.bossDefeatedByTier[String(tier.die)] = true;
        state.lastResult = 'Boss defeated (' + detail + '). The stacks part and the descent unlocks.';
      } else if (action === 'descend') {
        state.depth += 1;
        state.roomIndex += 1;
        state.currentQuest = buildQuest(state, tierForDepth(state.depth));
        state.lastResult = 'You descend one floor. (' + detail + ')';
      } else {
        state.roomIndex += 1;
        if (typeof S !== 'undefined' && S) {
          S.credits = Math.max(0, Number(S.credits || 0) + 30 + tier.die);
        }
        state.lastResult = 'Success: lore recovered and clues logged. (' + detail + ')';
      }
    } else {
      state.lastResult = 'Failure: consequence applied. (' + detail + ')';
    }

    if (typeof updateCreditsUI === 'function') updateCreditsUI();
    return renderLibraryModal();
  }

  window.openInfiniteLibrary = renderLibraryModal;
  window.resolveInfiniteLibraryAction = resolveInfiniteLibraryAction;
})();
