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

  var LIBRARY_ENCOUNTERS = [
    { min: 1, max: 4, name: 'Elevator', depth: 'any', blurb: 'A brass lift clings to impossible shelves, built by Owl Cultists where ladders fail.' },
    { min: 5, max: 5, name: 'Portal', depth: 'any', blurb: 'Rune-heavy steel plates hum. Nobody agrees where this portal lands next.' },
    { min: 6, max: 6, name: 'Page Knights', depth: 'any', blurb: 'An oath-bound guardian linked to a single book challenges your right to pass.' },
    { min: 7, max: 7, name: 'Owl Cultists', depth: 'shallow,deep', blurb: 'Masked trespassers in feathered cloaks drift deeper. They are wary, not eager for blood.' },
    { min: 8, max: 8, name: 'Spider Archivist', depth: 'any', blurb: 'Wax-born librarian construct arrives to define, contain, and seal loose words.' },
    { min: 9, max: 9, name: 'DeepReaders', depth: 'deep', blurb: 'A harsher archivist variant that does not define. It only destroys.' },
    { min: 10, max: 10, name: 'BrowserLords', depth: 'deep', blurb: 'Half-spider, half-human sovereigns of deeper stacks. They know routes to exits.' },
    { min: 11, max: 11, name: 'The Written', depth: 'any', blurb: 'Ink-bound thralls hunt any loose text and drag it to their section.' },
    { min: 12, max: 12, name: 'Blackhearted', depth: 'any', blurb: 'Word-hungry infected wanderers licking pages to survive.' },
    { min: 13, max: 13, name: 'Philophickers', depth: 'any', blurb: 'Walking Ideas test your beliefs and force outcomes as if doctrine were gravity.' },
    { min: 14, max: 14, name: 'Inkmites', depth: 'any', blurb: 'Tiny ink-eaters with scalpel arms swarm toward fresh writing and open skin.' },
    { min: 15, max: 15, name: 'Giant Termites', depth: 'deep', blurb: 'Shelf-boring predators create sudden tunnels and unstable shortcuts.' },
    { min: 16, max: 16, name: 'Skeleton Crew', depth: 'deep', blurb: 'Candle-lit skeletons march deeper as if answering a call from below.' },
    { min: 17, max: 17, name: 'Equillae', depth: 'deep', blurb: 'Biographic ghosts possess bodies to escape the stacks and reclaim old lives.' },
    { min: 18, max: 18, name: 'Librarians', depth: 'deep', blurb: 'Empty robes seek their missing book and may puppet you to retrieve it.' },
    { min: 19, max: 19, name: 'Bookworms', depth: 'any', blurb: 'Lost explorers turned giant caterpillars offer dubious aid, gossip, and drugs.' },
    { min: 20, max: 20, name: 'Words Unbound', depth: 'deep', blurb: 'Loose words and proto-sentences drift free. If they connect, reality obeys.' }
  ];

  var ELEVATOR_STATUS = [
    { min: 1, max: 4, text: 'Works fine.' },
    { min: 5, max: 8, text: 'Works fine, but only once before locking hard.' },
    { min: 9, max: 10, text: 'Inoperable. The lift can be repaired with parts and time.' },
    { min: 11, max: 11, text: 'Works, but only climbs halfway before stalling.' },
    { min: 12, max: 12, text: 'Wires will snap after 2 or more PCs step on it.' }
  ];

  var PORTAL_DESTINATIONS = [
    'Spidercombs - Wax catacombs rumored to lie near the Heart.',
    'Black Candle - A once-burning district where soot still blinds and chokes.',
    'The Labra - A giant candle chandelier wide enough to host whole stacks.',
    'The Boneyard - A half-living giant body harvested for spine and binding material.',
    'Shreddings - Drifts of torn notes, loose pages, and abandoned drafts.',
    'Double Down Drive - A singular hall that keeps stretching far past reason.',
    'The Intestine Labyrinth - Giant books hollowed into worm-eaten tunnels.',
    'The Obliette - Where books go to die and titles are forgotten.',
    'The Sway - Stacks balanced in open air, constantly moving with unseen wind.',
    'Lawless - Ironically orderly archives of legal documents and true-name records.',
    'Labrys - Home halls of the Bookbinder\'s Guild.',
    'Settle - A settlement of seekers who gave up on finding the Heart.'
  ];

  var PHILOPHICKER_IDEAS = [
    'Love: fused partners demand vows and legal marriage rites.',
    'Nihilism: deny meaning, deny purpose, maybe deny your existence.',
    'Shintoism: naked shrine-builders plant seeds in books and grow library gardens.',
    'Relativism: reality changes by speaker; dissenters become foreign threats.',
    'Absurdism: random wonder-magic and impossible decisions as doctrine.',
    'Chaos: your life is judged by long consequence chains across history.'
  ];

  var LIBRARY_TRAPS = [
    'Quiet Area: speak and your words shatter loudly on the floor, calling Word Stealers.',
    'Bookworm Trigger: reading an unauthorized volume reduces all action dice to d4 until the book is replaced.',
    'Dust Jacket: disturbed dust burns the truth of you into your skin as living text.',
    'Bookwyrm Seal: removing a wing-book triggers a psychic fire-breath backlash (+3 Mental Stress) until replaced.'
  ];

  var LIBRARY_WINGS = [
    'Goblin Thoughts - shelves of fragmented goblin ideas and accidental prophecies.',
    'Taxes - one true-name ledger hidden among millions of decoys.',
    'Tape Books - endless VHS archives filed like sacred scripture.',
    'Not Yet - future books waiting for their authors to catch up.',
    'Dinosaurs - false histories of things that never happened.',
    'Inciting Incident - every text starts with a beginning and no resolution.'
  ];

  var LIBRARY_EXIT_PATHS = [
    'Risk a Portal jump and trust the map re-roll.',
    'Die before someone candles your skeleton.',
    'Bargain with a BrowserLord, who always knows a nearest exit.',
    'Track and persuade DeepReaders to point a way out.',
    'Let an Urban Ranger guide the route; others risk getting lost.',
    'Appeal to a spirit you still have favor with.',
    'Swear Page Knight vows and follow your linked book to an exit.',
    'Follow butterflies. They always fly toward the nearest way out.',
    'Use songbirds that can always return home.'
  ];

  var BOOK_FETCH_OBJECTIVES = [
    'recover a censored folio before a rival faction burns it',
    'steal a true-name ledger page without waking the shelf ward',
    'copy one paragraph from a future text in the Not Yet wing',
    'retrieve a biography volume needed to banish an Equillae possession',
    'deliver a blank codex to Labrys for emergency rebinding'
  ];

  var BOOK_FETCH_COMPLICATIONS = [
    'an Owl Cultist elevator is one use from collapse',
    'a Spider Archivist lit-candle trigger is already active in this wing',
    'the path is sealed by a Quiet Area trap and Word Stealers are near',
    'a Philophicker sect claims legal ownership of your target text',
    'the target book has become a Page Knight anchor and cannot be moved openly'
  ];

  var BOOK_FETCH_TWISTS = [
    'the target text is alive and negotiates its own ransom',
    'the destination was misfiled and now sits one depth deeper',
    'the client\'s "authorized copy" is forged, and the real one is cursed',
    'every written note you carry attracts Inkmites until sealed in wax',
    'the map itself keeps rewriting, pointing toward a different wing each hour'
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
        activeHexKey: '',
        delveCount: 0,
        lastResult: '',
        lastEncounter: '',
        lastHook: ''
      };
    }
    return S.infiniteLibrary;
  }

  function getProvinceHexByKey(key) {
    var parts = String(key || '').split(',');
    if (parts.length !== 2) return null;
    var col = Number(parts[0]);
    var row = Number(parts[1]);
    if (!isFinite(col) || !isFinite(row)) return null;
    if (typeof window.setProvinceSelectedKey === 'function') {
      try {
        window.setProvinceSelectedKey(col + ',' + row);
      } catch (_err) {}
    }
    if (window.selectedHex && Number(window.selectedHex.col) === col && Number(window.selectedHex.row) === row) {
      return window.selectedHex;
    }
    return null;
  }

  function attachLibraryStateToHex(state) {
    if (!state || !state.activeHexKey) return;
    var hex = getProvinceHexByKey(state.activeHexKey);
    if (!hex) return;
    hex.data = hex.data || {};
    hex.data.infiniteLibrary = hex.data.infiniteLibrary || {};
    hex.data.infiniteLibrary.depth = Number(state.depth || 1);
    hex.data.infiniteLibrary.roomIndex = Number(state.roomIndex || 0);
    hex.data.infiniteLibrary.lastResult = String(state.lastResult || '');
    hex.data.infiniteLibrary.delveCount = Number(state.delveCount || 0);
    hex.data.infiniteLibrary.lastEncounter = String(state.lastEncounter || '');
    hex.data.infiniteLibrary.lastHook = String(state.lastHook || '');
  }

  function readLibraryStateFromHex(state, key) {
    if (!state) return;
    var hex = getProvinceHexByKey(key);
    if (!hex || !hex.data || !hex.data.infiniteLibrary || typeof hex.data.infiniteLibrary !== 'object') return;
    var hs = hex.data.infiniteLibrary;
    if (typeof hs.depth === 'number') state.depth = Math.max(1, Number(hs.depth || 1));
    if (typeof hs.roomIndex === 'number') state.roomIndex = Math.max(0, Number(hs.roomIndex || 0));
    if (typeof hs.lastResult === 'string') state.lastResult = hs.lastResult;
    if (typeof hs.delveCount === 'number') state.delveCount = Math.max(Number(state.delveCount || 0), Number(hs.delveCount || 0));
    if (typeof hs.lastEncounter === 'string') state.lastEncounter = hs.lastEncounter;
    if (typeof hs.lastHook === 'string') state.lastHook = hs.lastHook;
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

  function pickNow(list) {
    if (!Array.isArray(list) || !list.length) return '';
    return list[Math.floor(Math.random() * list.length)] || list[0];
  }

  function depthBand(depth) {
    var d = Math.max(1, Number(depth || 1));
    if (d <= 4) return 'shallow';
    if (d >= 8) return 'deep';
    return 'mid';
  }

  function depthAllowed(depthRule, band) {
    var rule = String(depthRule || 'any').toLowerCase();
    if (rule === 'any') return true;
    if (rule.indexOf('shallow') >= 0 && band === 'shallow') return true;
    if (rule.indexOf('deep') >= 0 && band === 'deep') return true;
    return false;
  }

  function findByRoll(list, value) {
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (value >= Number(item.min) && value <= Number(item.max)) return item;
    }
    return list[0] || null;
  }

  function rollElevatorStatus() {
    var r = rollDie(12);
    var status = findByRoll(ELEVATOR_STATUS, r);
    return 'Elevator d12=' + r + ': ' + (status ? status.text : 'Unknown status.');
  }

  function rollPortalDestination() {
    var r = rollDie(12);
    var place = PORTAL_DESTINATIONS[Math.max(0, r - 1)] || PORTAL_DESTINATIONS[0];
    return 'Portal d12=' + r + ': ' + place;
  }

  function rollEncounterForDepth(depth) {
    var band = depthBand(depth);
    var chosen = null;
    var d20 = 0;
    for (var tries = 0; tries < 30; tries++) {
      d20 = rollDie(20);
      var found = findByRoll(LIBRARY_ENCOUNTERS, d20);
      if (found && depthAllowed(found.depth, band)) {
        chosen = found;
        break;
      }
    }
    if (!chosen) chosen = LIBRARY_ENCOUNTERS[0];

    var detail = '';
    if (chosen.name === 'Elevator') detail = rollElevatorStatus();
    if (chosen.name === 'Portal') detail = rollPortalDestination();
    if (chosen.name === 'Philophickers') detail = 'Idea pressure: ' + pickNow(PHILOPHICKER_IDEAS);
    if (chosen.name === 'Words Unbound') detail = 'Word trap: ' + pickNow(LIBRARY_TRAPS);

    return {
      roll: d20,
      encounter: chosen,
      band: band,
      detail: detail
    };
  }

  function generateBookFetchHook(state) {
    var depth = Math.max(1, Number(state && state.depth || 1));
    var wing = pickNow(LIBRARY_WINGS);
    var objective = pickNow(BOOK_FETCH_OBJECTIVES);
    var complication = pickNow(BOOK_FETCH_COMPLICATIONS);
    var twist = pickNow(BOOK_FETCH_TWISTS);
    var exitPlan = pickNow(LIBRARY_EXIT_PATHS);
    return 'Depth ' + depth + ' · ' + wing + '. Objective: ' + objective + '. Complication: ' + complication + '. Twist: ' + twist + '. Exit plan: ' + exitPlan + '.';
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
    if (!state.activeHexKey && typeof window.getProvinceSelectedKey === 'function') {
      try { state.activeHexKey = String(window.getProvinceSelectedKey() || ''); } catch (_err) { state.activeHexKey = ''; }
    }
    var tier = tierForDepth(state.depth);
    var roomText = pick(ROOM_SNIPPETS[tier.die], 'room:' + state.depth + ':' + state.roomIndex);
    var bookText = pick(BOOK_MICRO_SNIPPETS, 'book:' + state.depth + ':' + state.roomIndex);
    if (!state.currentQuest) state.currentQuest = buildQuest(state, tier);
    var quest = state.currentQuest;
    var bossNow = maybeBossRoom(state, tier);
    var lastEncounter = String(state.lastEncounter || '').trim();
    var lastHook = String(state.lastHook || '').trim();

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
      + (lastEncounter ? ('<div style="font-size:.66rem;color:#9cb8ff;margin-bottom:.12rem;"><strong>Encounter:</strong> ' + lastEncounter + '</div>') : '')
      + (lastHook ? ('<div style="font-size:.66rem;color:var(--muted3);margin-bottom:.14rem;"><strong>Book Fetch Hook:</strong> ' + lastHook + '</div>') : '')
      + '<div style="display:flex;gap:.24rem;flex-wrap:wrap;">'
      + '<button class="btn btn-sm btn-primary" onclick="resolveInfiniteLibraryAction(\'search\')">Search Stacks (Mind vs d' + tier.die + ')</button>'
      + '<button class="btn btn-sm" onclick="resolveInfiniteLibraryAction(\'trace\')">Trace Spiral Route (Adventure vs d' + tier.die + ')</button>'
      + '<button class="btn btn-sm" onclick="resolveInfiniteLibraryAction(\'encounter\')">Roll Encounter (D20)</button>'
      + '<button class="btn btn-sm" onclick="resolveInfiniteLibraryAction(\'hook\')">Generate Book-Fetch Hook</button>'
      + (bossNow
        ? '<button class="btn btn-sm btn-red" onclick="resolveInfiniteLibraryAction(\'boss\')">Confront ' + tier.boss + '</button>'
        : '<button class="btn btn-sm btn-teal" onclick="resolveInfiniteLibraryAction(\'descend\')">Descend To Next Room</button>')
      + '</div>'
      + '</div>';
    openModal('Infinite Library', html);
    attachLibraryStateToHex(state);
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

    if (action === 'encounter') {
      var rolled = rollEncounterForDepth(state.depth);
      var baseLine = 'd20=' + rolled.roll + ' (' + rolled.band + '): ' + rolled.encounter.name + ' - ' + rolled.encounter.blurb;
      state.lastEncounter = rolled.detail ? (baseLine + ' | ' + rolled.detail) : baseLine;
      state.lastResult = 'Encounter generated.';
      attachLibraryStateToHex(state);
      return renderLibraryModal();
    }

    if (action === 'hook') {
      state.lastHook = generateBookFetchHook(state);
      state.lastResult = 'Book-fetch contract generated.';
      attachLibraryStateToHex(state);
      return renderLibraryModal();
    }

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
        var travelEncounter = rollEncounterForDepth(state.depth);
        state.lastEncounter = 'On descent: d20=' + travelEncounter.roll + ' (' + travelEncounter.band + '): ' + travelEncounter.encounter.name
          + (travelEncounter.detail ? (' | ' + travelEncounter.detail) : '');
        state.lastResult = 'You descend one floor. (' + detail + ')';
      } else {
        state.roomIndex += 1;
        if (typeof S !== 'undefined' && S) {
          S.credits = Math.max(0, Number(S.credits || 0) + 30 + tier.die);
        }
        if (action === 'search') {
          var searchEncounter = rollEncounterForDepth(state.depth);
          state.lastEncounter = 'While searching: d20=' + searchEncounter.roll + ' (' + searchEncounter.band + '): ' + searchEncounter.encounter.name
            + (searchEncounter.detail ? (' | ' + searchEncounter.detail) : '');
        }
        state.lastResult = 'Success: lore recovered and clues logged. (' + detail + ')';
      }
    } else {
      state.lastResult = 'Failure: consequence applied. (' + detail + ')';
    }

    if (typeof updateCreditsUI === 'function') updateCreditsUI();
    attachLibraryStateToHex(state);
    return renderLibraryModal();
  }

  function openInfiniteLibraryAtHex(col, row) {
    if (typeof col !== 'number' || typeof row !== 'number') return renderLibraryModal();
    var hex = getProvinceHexByKey(String(col) + ',' + String(row));
    if (!hex) {
      if (typeof showNotif === 'function') showNotif('Library hex could not be resolved.', 'warn');
      return false;
    }
    if (String(hex.type || '').toLowerCase() !== 'library') {
      if (typeof showNotif === 'function') showNotif('This area is not the Infinite Library.', 'warn');
      return false;
    }

    var state = ensureLibraryState();
    if (!state) return false;
    state.activeHexKey = String(col) + ',' + String(row);
    readLibraryStateFromHex(state, state.activeHexKey);
    state.delveCount = Math.max(0, Number(state.delveCount || 0) + 1);
    if (typeof S !== 'undefined' && S && S.soloGM && S.soloGM.websiteCounters) {
      S.soloGM.websiteCounters.libraryDelves = Math.max(0, Number(S.soloGM.websiteCounters.libraryDelves || 0) + 1);
    }
    return renderLibraryModal();
  }

  window.openInfiniteLibrary = renderLibraryModal;
  window.openInfiniteLibraryAtHex = openInfiniteLibraryAtHex;
  window.resolveInfiniteLibraryAction = resolveInfiniteLibraryAction;
})();
