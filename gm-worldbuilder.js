(function () {
  function isGMMode() {
    try {
      return !!(window.settingsSystem && typeof window.settingsSystem.isGMMode === 'function' && window.settingsSystem.isGMMode());
    } catch (_err) {
      return false;
    }
  }

  function randomOf(list) {
    if (!Array.isArray(list) || !list.length) return '';
    return list[Math.floor(Math.random() * list.length)] || '';
  }

  function uid(prefix) {
    return String(prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e5).toString(36);
  }

  function ensureState() {
    if (typeof window.S === 'undefined' || !window.S) window.S = {};
    var base = window.S.gmWorldbuilder || {};
    window.S.gmWorldbuilder = {
      genre: String(base.genre || 'Dark Fantasy'),
      storyPrompt: String(base.storyPrompt || ''),
      monsterBlock: String(base.monsterBlock || ''),
      levels: Array.isArray(base.levels) ? base.levels : [],
      locations: Array.isArray(base.locations) ? base.locations : [],
      portals: Array.isArray(base.portals) ? base.portals : [],
      characters: Array.isArray(base.characters) ? base.characters : [],
      things: Array.isArray(base.things) ? base.things : [],
      stickyNotes: Array.isArray(base.stickyNotes) ? base.stickyNotes : [],
      checklists: Array.isArray(base.checklists) ? base.checklists : [],
      connections: Array.isArray(base.connections) ? base.connections : []
    };
    return window.S.gmWorldbuilder;
  }

  var NAME_GROUPS = {
    Spanish: ['Iria', 'Mateo', 'Lucia', 'Tomas', 'Rocio', 'Sergio', 'Adela', 'Gael'],
    Inuit: ['Aputi', 'Nuka', 'Siku', 'Panik', 'Nanuq', 'Qannik', 'Ivalu', 'Tulimaq'],
    Persian: ['Arash', 'Darya', 'Mehrdad', 'Soraya', 'Rostam', 'Parisa', 'Kian', 'Laleh'],
    Egyptian: ['Amunet', 'Seti', 'Neferu', 'Khepri', 'Iset', 'Djoser', 'Merit', 'Bastet'],
    Navajo: ['Ashkii', 'Yazhi', 'Atsa', 'Tadita', 'Hastiin', 'Nizhoni', 'Kai', 'Atsaidi'],
    Celtic: ['Eira', 'Bran', 'Maeve', 'Cian', 'Nessa', 'Ronan', 'Orla', 'Taran'],
    Japanese: ['Akira', 'Ren', 'Yui', 'Kaede', 'Sora', 'Haru', 'Mio', 'Takumi'],
    Yoruba: ['Ade', 'Kemi', 'Tunde', 'Sade', 'Bola', 'Ayo', 'Femi', 'Nia'],
    Norse: ['Astrid', 'Leif', 'Freya', 'Ivar', 'Sigrid', 'Bjorn', 'Runa', 'Eirik'],
    Slavic: ['Mira', 'Viktor', 'Anya', 'Boris', 'Ilya', 'Nadia', 'Sasha', 'Yelena']
  };

  var GENRES = ['Dark Fantasy', 'Sword And Sorcery', 'Post-Apocalyptic', 'Cosmic Horror', 'Dieselpunk', 'Folkloric Mystery', 'Mythic Sci-Fi', 'Nautical Ruinpunk'];

  function storyPromptForGenre(genre) {
    var byGenre = {
      'Dark Fantasy': [
        'A covenant city survives by sacrificing one memory from each traveler at its gates.',
        'A sainted relic starts speaking in a rival voice and names one PC as its next vessel.'
      ],
      'Sword And Sorcery': [
        'A warlord offers peace if the party steals a map from a cathedral vault.',
        'A sand-market auction sells a storm bound in iron bells.'
      ],
      'Post-Apocalyptic': [
        'A cracked reactor keeps a settlement warm, but each cycle mutates one district.',
        'A convoy vanished on a safe route and left only polished footprints.'
      ],
      'Cosmic Horror': [
        'A moonless tide exposes stairs descending into a singing void.',
        'Astronomers map a star that moves only when no one watches it.'
      ]
    };
    var fallback = [
      'A patron asks the party to broker peace between two places connected by a forbidden portal.',
      'A missing NPC returns with accurate memories of a timeline that never happened.'
    ];
    return randomOf(byGenre[String(genre || '')] || fallback);
  }

  function buildMonsterBlock(genre) {
    var tags = {
      force: Math.ceil(Math.random() * 12),
      cunning: Math.ceil(Math.random() * 12),
      resolve: Math.ceil(Math.random() * 12),
      defend: Math.ceil(Math.random() * 12),
      health: 6 + Math.ceil(Math.random() * 24),
      deathNumber: 4 + Math.ceil(Math.random() * 8)
    };
    var skills = [
      'Ambush: Gain +2 Cunning on first round.',
      'Predatory Step: Move one extra zone per turn.',
      'Warding Hide: First hit each round deals 0 damage.',
      'Ruin Sense: Detect hidden PCs in adjacent location.'
    ];
    return 'Genre: ' + genre + '\n'
      + 'Force ' + tags.force + ' | Cunning ' + tags.cunning + ' | Resolve ' + tags.resolve + ' | Defend ' + tags.defend + '\n'
      + 'Health ' + tags.health + ' | Death Number ' + tags.deathNumber + '\n'
      + 'Skills: ' + randomOf(skills) + ' / ' + randomOf(skills.filter(function (s) { return s !== skills[0]; }));
  }

  function getMerchantItems() {
    var out = [];
    try {
      var data = window.SHOP_DATA;
      if (!data || typeof data !== 'object') return out;
      Object.keys(data).forEach(function (k) {
        var arr = data[k];
        if (!Array.isArray(arr)) return;
        arr.forEach(function (it) {
          if (!it || !it.name) return;
          out.push({
            name: String(it.name),
            category: String(k),
            desc: String(it.desc || ''),
            cost: Number(it.cost || 0)
          });
        });
      });
    } catch (_err) {}
    return out;
  }

  function openImagePicker(cb) {
    var picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.onchange = function () {
      var file = picker.files && picker.files[0] ? picker.files[0] : null;
      if (!file) return;
      var r = new FileReader();
      r.onload = function () {
        cb(String(r.result || ''));
      };
      r.readAsDataURL(file);
    };
    picker.click();
  }

  function render() {
    var root = document.getElementById('tab-gmworldbuilder');
    if (!root) return;
    var st = ensureState();

    var levelsHtml = st.levels.map(function (lvl) {
      var locs = st.locations.filter(function (l) { return l.levelId === lvl.id; });
      var locHtml = locs.map(function (loc) {
        return '<div class="gmwb-loc" style="border-left-color:' + (loc.bg || 'var(--teal)') + '">'
          + '<div class="gmwb-entity-name">' + escapeHtml(loc.name) + '</div>'
          + '<div class="gmwb-muted">' + escapeHtml(loc.desc || 'No description') + '</div>'
          + '</div>';
      }).join('');
      return '<div class="gmwb-level" style="background:' + escapeHtml(lvl.bg || 'rgba(255,255,255,.02)') + ';">'
        + '<div class="gmwb-level-head"><strong>' + escapeHtml(lvl.name) + '</strong>'
        + '<button class="btn btn-xs" onclick="gmWorldbuilderAddLocation(\'' + lvl.id + '\')">+ Location</button></div>'
        + (locHtml || '<div class="gmwb-muted">No locations yet.</div>')
        + '</div>';
    }).join('');

    var charsHtml = st.characters.map(function (c) {
      return '<div class="gmwb-entity">'
        + '<div class="gmwb-entity-head"><span class="gmwb-entity-name">' + escapeHtml(c.name) + ' (' + escapeHtml(c.type) + ')</span>'
        + '<button class="btn btn-xs" onclick="gmWorldbuilderMoveCharacter(\'' + c.id + '\')">Move</button></div>'
        + '<div class="gmwb-muted">' + escapeHtml(c.desc || 'No description') + '</div>'
        + '<div class="gmwb-row" style="margin-top:.25rem;"><span class="gmwb-chip">F ' + Number((c.stats && c.stats.force) || 0) + '</span>'
        + '<span class="gmwb-chip">C ' + Number((c.stats && c.stats.cunning) || 0) + '</span>'
        + '<span class="gmwb-chip">R ' + Number((c.stats && c.stats.resolve) || 0) + '</span>'
        + '<span class="gmwb-chip">D ' + Number((c.stats && c.stats.defend) || 0) + '</span></div>'
        + '</div>';
    }).join('');

    var checklistHtml = st.checklists.map(function (c) {
      return '<label class="gmwb-check ' + (c.done ? 'done' : '') + '"><input type="checkbox" ' + (c.done ? 'checked' : '') + ' onchange="gmWorldbuilderToggleChecklist(\'' + c.id + '\')">' + escapeHtml(c.text) + '</label>';
    }).join('');

    var stickyHtml = st.stickyNotes.map(function (n) {
      return '<div class="gmwb-sticky" style="background:' + escapeHtml(n.color || '#f8e36a') + ';color:#1f1f1f;">'
        + '<div style="font-weight:700;font-size:.76rem;">Sticky</div>'
        + '<div style="font-size:.78rem;line-height:1.4;">' + escapeHtml(n.text) + '</div>'
        + (n.image ? '<img src="' + n.image + '" alt="Sticky image">' : '')
        + '</div>';
    }).join('');

    var portalsHtml = st.portals.map(function (p) {
      var from = st.locations.find(function (l) { return l.id === p.from; });
      var to = st.locations.find(function (l) { return l.id === p.to; });
      return '<div class="gmwb-muted">' + escapeHtml((from && from.name) || '?') + ' -> ' + escapeHtml((to && to.name) || '?') + ' (' + escapeHtml(p.label || 'Portal') + ')</div>';
    }).join('');

    var connHtml = st.connections.map(function (c) {
      return '<div class="gmwb-muted">' + escapeHtml(c.a) + ' -> ' + escapeHtml(c.b) + ' : ' + escapeHtml(c.label || 'related') + '</div>';
    }).join('');

    root.innerHTML = ''
      + '<div class="card" style="margin-bottom:.6rem;">'
      + '<div class="section-title">GM Worldbuilder Forge</div>'
      + '<div class="gmwb-muted">Build campaign nodes, random prompts, NPCs, and links. This tab is visible only in GM Mode.</div>'
      + '</div>'
      + '<div class="gmwb-root">'
      + '<section class="gmwb-card">'
      + '<div class="gmwb-title">Prompt Engine</div>'
      + '<div class="form-row"><label class="sub-label">Genre</label><select id="gmwbGenre" class="gmwb-select">'
      + GENRES.map(function (g) { return '<option ' + (st.genre === g ? 'selected' : '') + '>' + g + '</option>'; }).join('')
      + '</select></div>'
      + '<div class="gmwb-row"><button class="btn btn-sm btn-teal" onclick="gmWorldbuilderGenerateStory()">Generate Story Prompt</button>'
      + '<button class="btn btn-sm" onclick="gmWorldbuilderGenerateMonster()">Generate Monster Block</button></div>'
      + '<div class="gmwb-list">'
      + '<div class="gmwb-entity"><div class="gmwb-entity-name">Story Prompt</div><div class="gmwb-muted">' + escapeHtml(st.storyPrompt || 'No prompt yet.') + '</div></div>'
      + '<div class="gmwb-entity"><div class="gmwb-entity-name">Monster + Skills</div><div class="gmwb-muted" style="white-space:pre-wrap;">' + escapeHtml(st.monsterBlock || 'No monster yet.') + '</div></div>'
      + '</div>'
      + '<div class="gmwb-title" style="margin-top:.6rem;">Merchant Pull</div>'
      + '<div class="gmwb-row"><button class="btn btn-sm" onclick="gmWorldbuilderPullMerchantItem()">Random Merchant Item</button></div>'
      + '<div id="gmwbMerchantPull" class="gmwb-muted" style="margin-top:.3rem;">Use this to inject items from Merchant stock into your prep.</div>'
      + '<div class="gmwb-title" style="margin-top:.6rem;">Task Checklist</div>'
      + '<div class="gmwb-row"><input id="gmwbTaskText" class="gmwb-input" placeholder="Add prep task..."><button class="btn btn-xs" onclick="gmWorldbuilderAddChecklist()">Add</button></div>'
      + '<div class="gmwb-list">' + (checklistHtml || '<div class="gmwb-muted">No tasks.</div>') + '</div>'
      + '</section>'

      + '<section class="gmwb-card">'
      + '<div class="gmwb-title">Levels, Locations, Portals</div>'
      + '<div class="gmwb-row"><input id="gmwbLevelName" class="gmwb-input" placeholder="Level name (e.g. Surface)"><input id="gmwbLevelBg" class="gmwb-input" placeholder="Background color/gradient (CSS)"><button class="btn btn-xs" onclick="gmWorldbuilderAddLevel()">Add Level</button></div>'
      + '<div class="gmwb-list">' + (levelsHtml || '<div class="gmwb-muted">No levels yet.</div>') + '</div>'
      + '<div class="gmwb-title" style="margin-top:.6rem;">Portal Links</div>'
      + '<div class="gmwb-row"><button class="btn btn-xs" onclick="gmWorldbuilderAddPortal()">Create Portal</button></div>'
      + '<div class="gmwb-list">' + (portalsHtml || '<div class="gmwb-muted">No portals yet.</div>') + '</div>'
      + '<div class="gmwb-title" style="margin-top:.6rem;">Connections</div>'
      + '<div class="gmwb-row"><input id="gmwbConnA" class="gmwb-input" placeholder="From (name)"><input id="gmwbConnB" class="gmwb-input" placeholder="To (name)"><input id="gmwbConnLabel" class="gmwb-input" placeholder="Relation"><button class="btn btn-xs" onclick="gmWorldbuilderAddConnection()">Link</button></div>'
      + '<div class="gmwb-connections">' + (connHtml || '<div class="gmwb-muted">No connections yet.</div>') + '</div>'
      + '</section>'

      + '<section class="gmwb-card">'
      + '<div class="gmwb-title">Characters, Items, Sticky Notes</div>'
      + '<div class="gmwb-row"><input id="gmwbCharName" class="gmwb-input" placeholder="Character name">'
      + '<select id="gmwbCharType" class="gmwb-select"><option value="NPC">NPC</option><option value="PC">PC</option></select>'
      + '<button class="btn btn-xs" onclick="gmWorldbuilderGenerateName()">Name Gen</button>'
      + '<button class="btn btn-xs btn-teal" onclick="gmWorldbuilderAddCharacter()">Add</button></div>'
      + '<div class="gmwb-row" style="margin-top:.22rem;"><select id="gmwbNameCulture" class="gmwb-select">'
      + Object.keys(NAME_GROUPS).map(function (k) { return '<option>' + escapeHtml(k) + '</option>'; }).join('')
      + '</select><span class="gmwb-muted">Culture group quick picker.</span></div>'
      + '<div class="gmwb-list">' + (charsHtml || '<div class="gmwb-muted">No characters yet.</div>') + '</div>'
      + '<div class="gmwb-title" style="margin-top:.6rem;">Things And Assignment</div>'
      + '<div class="gmwb-row"><button class="btn btn-xs" onclick="gmWorldbuilderAddThing()">Add Thing</button><button class="btn btn-xs" onclick="gmWorldbuilderTransferThing()">Transfer Thing</button></div>'
      + '<div class="gmwb-title" style="margin-top:.6rem;">Sticky Notes + Images</div>'
      + '<div class="gmwb-row"><input id="gmwbStickyText" class="gmwb-input" placeholder="Sticky note text"><input id="gmwbStickyColor" class="gmwb-input" placeholder="#f8e36a"><button class="btn btn-xs" onclick="gmWorldbuilderAddSticky()">Add Sticky</button><button class="btn btn-xs" onclick="gmWorldbuilderAddStickyWithImage()">Add Sticky + Image</button></div>'
      + '<div class="gmwb-sticky-grid" style="margin-top:.35rem;">' + (stickyHtml || '<div class="gmwb-muted">No sticky notes yet.</div>') + '</div>'
      + '<div class="gmwb-row" style="margin-top:.55rem;"><button class="btn btn-sm" onclick="if(typeof saveCharacter===\'function\'){saveCharacter();}">Save Campaign Data</button></div>'
      + '</section>'
      + '</div>';

    var genreSel = document.getElementById('gmwbGenre');
    if (genreSel) {
      genreSel.onchange = function () {
        ensureState().genre = String(this.value || 'Dark Fantasy');
      };
    }
  }

  function escapeHtml(v) {
    return String(v || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function addLevel() {
    var st = ensureState();
    var nameEl = document.getElementById('gmwbLevelName');
    var bgEl = document.getElementById('gmwbLevelBg');
    var name = String((nameEl && nameEl.value) || '').trim() || ('Level ' + (st.levels.length + 1));
    var bg = String((bgEl && bgEl.value) || '').trim() || 'rgba(33,40,66,.35)';
    st.levels.push({ id: uid('lvl'), name: name, bg: bg });
    if (nameEl) nameEl.value = '';
    render();
  }

  function addLocation(levelId) {
    var st = ensureState();
    var name = prompt('Location name?');
    if (!name) return;
    var desc = prompt('Description?', 'Add hazards, hooks, and atmosphere.') || '';
    st.locations.push({ id: uid('loc'), name: String(name), desc: String(desc), levelId: String(levelId || ''), bg: '#2ec4b6' });
    render();
  }

  function addPortal() {
    var st = ensureState();
    if (st.locations.length < 2) {
      if (typeof showNotif === 'function') showNotif('Need at least two locations to make a portal.', 'warn');
      return;
    }
    var from = prompt('Portal FROM location name?');
    var to = prompt('Portal TO location name?');
    if (!from || !to) return;
    var a = st.locations.find(function (l) { return l.name.toLowerCase() === String(from).toLowerCase(); });
    var b = st.locations.find(function (l) { return l.name.toLowerCase() === String(to).toLowerCase(); });
    if (!a || !b) {
      if (typeof showNotif === 'function') showNotif('Location not found. Use exact names.', 'warn');
      return;
    }
    var label = prompt('Portal label?', 'One-way gate') || 'Portal';
    st.portals.push({ id: uid('prt'), from: a.id, to: b.id, label: String(label) });
    render();
  }

  function addCharacter() {
    var st = ensureState();
    var nm = document.getElementById('gmwbCharName');
    var ty = document.getElementById('gmwbCharType');
    var name = String((nm && nm.value) || '').trim();
    if (!name) return;
    st.characters.push({
      id: uid('ch'),
      type: String((ty && ty.value) || 'NPC'),
      name: name,
      desc: 'Describe personality, motive, and pressure points.',
      locationId: '',
      stats: {
        force: 4 + Math.ceil(Math.random() * 6),
        cunning: 4 + Math.ceil(Math.random() * 6),
        resolve: 4 + Math.ceil(Math.random() * 6),
        defend: 4 + Math.ceil(Math.random() * 6)
      },
      checklist: []
    });
    if (nm) nm.value = '';
    render();
  }

  function moveCharacter(charId) {
    var st = ensureState();
    var c = st.characters.find(function (x) { return x.id === charId; });
    if (!c) return;
    if (!st.locations.length) {
      if (typeof showNotif === 'function') showNotif('No locations yet.', 'warn');
      return;
    }
    var targetName = prompt('Move to location (name):', '');
    if (!targetName) return;
    var loc = st.locations.find(function (l) { return l.name.toLowerCase() === String(targetName).toLowerCase(); });
    if (!loc) {
      if (typeof showNotif === 'function') showNotif('Location not found.', 'warn');
      return;
    }
    c.locationId = loc.id;
    render();
  }

  function generateName() {
    var cultureEl = document.getElementById('gmwbNameCulture');
    var culture = String((cultureEl && cultureEl.value) || 'Spanish');
    var arr = NAME_GROUPS[culture] || NAME_GROUPS.Spanish;
    var next = randomOf(arr) + ' ' + randomOf(['Vale', 'Ash', 'Kerr', 'Sol', 'Thorn', 'Nox', 'Reed', 'Mourn']);
    var target = document.getElementById('gmwbCharName');
    if (target) target.value = next;
  }

  function addThing() {
    var st = ensureState();
    var name = prompt('Thing / Relic / Item name?');
    if (!name) return;
    var owner = prompt('Assign to which character or location name? (optional)', '');
    st.things.push({ id: uid('thing'), name: String(name), owner: String(owner || ''), desc: 'Add details and mechanics.' });
    render();
  }

  function transferThing() {
    var st = ensureState();
    if (!st.things.length) {
      if (typeof showNotif === 'function') showNotif('No things to transfer.', 'warn');
      return;
    }
    var name = prompt('Thing name to transfer?');
    if (!name) return;
    var thing = st.things.find(function (t) { return t.name.toLowerCase() === String(name).toLowerCase(); });
    if (!thing) return;
    var owner = prompt('New owner (NPC or location name):', thing.owner || '');
    if (owner === null) return;
    thing.owner = String(owner || '');
    render();
  }

  function addSticky(withImage) {
    var st = ensureState();
    var txt = document.getElementById('gmwbStickyText');
    var col = document.getElementById('gmwbStickyColor');
    var noteText = String((txt && txt.value) || '').trim() || 'Untitled note';
    var color = String((col && col.value) || '').trim() || '#f8e36a';
    if (withImage) {
      openImagePicker(function (data) {
        st.stickyNotes.push({ id: uid('sticky'), text: noteText, color: color, image: data });
        if (txt) txt.value = '';
        render();
      });
      return;
    }
    st.stickyNotes.push({ id: uid('sticky'), text: noteText, color: color, image: '' });
    if (txt) txt.value = '';
    render();
  }

  function addChecklist() {
    var st = ensureState();
    var el = document.getElementById('gmwbTaskText');
    var text = String((el && el.value) || '').trim();
    if (!text) return;
    st.checklists.push({ id: uid('task'), text: text, done: false });
    if (el) el.value = '';
    render();
  }

  function toggleChecklist(id) {
    var st = ensureState();
    var t = st.checklists.find(function (x) { return x.id === id; });
    if (!t) return;
    t.done = !t.done;
    render();
  }

  function addConnection() {
    var st = ensureState();
    var a = document.getElementById('gmwbConnA');
    var b = document.getElementById('gmwbConnB');
    var l = document.getElementById('gmwbConnLabel');
    var av = String((a && a.value) || '').trim();
    var bv = String((b && b.value) || '').trim();
    var lv = String((l && l.value) || '').trim() || 'related';
    if (!av || !bv) return;
    st.connections.push({ id: uid('lnk'), a: av, b: bv, label: lv });
    if (a) a.value = '';
    if (b) b.value = '';
    if (l) l.value = '';
    render();
  }

  function generateStory() {
    var st = ensureState();
    var genreSel = document.getElementById('gmwbGenre');
    st.genre = String((genreSel && genreSel.value) || st.genre || 'Dark Fantasy');
    st.storyPrompt = storyPromptForGenre(st.genre);
    render();
  }

  function generateMonster() {
    var st = ensureState();
    var genreSel = document.getElementById('gmwbGenre');
    st.genre = String((genreSel && genreSel.value) || st.genre || 'Dark Fantasy');
    st.monsterBlock = buildMonsterBlock(st.genre);
    render();
  }

  function pullMerchantItem() {
    var items = getMerchantItems();
    if (!items.length) {
      if (typeof showNotif === 'function') showNotif('Merchant catalog unavailable.', 'warn');
      return;
    }
    var pick = randomOf(items);
    var el = document.getElementById('gmwbMerchantPull');
    if (el) {
      el.innerHTML = '<strong>' + escapeHtml(pick.name) + '</strong> [' + escapeHtml(pick.category) + '] - '
        + escapeHtml(pick.desc || 'No description') + ' (Cost: ' + Number(pick.cost || 0) + 'c)';
    }
  }

  function mount() {
    ensureState();
    render();
    updateVisibility();
  }

  function updateVisibility() {
    var btn = document.getElementById('tabnav-gmworldbuilder');
    var panel = document.getElementById('tab-gmworldbuilder');
    var gm = isGMMode();
    if (btn) btn.style.display = gm ? '' : 'none';
    if (panel && !gm && panel.classList.contains('active') && typeof window.switchTab === 'function') {
      var fallback = document.getElementById('tabnav-character') || document.querySelector("nav .tab-btn[onclick*=\"switchTab('character'\"]");
      window.switchTab('character', fallback || null);
    }
  }

  window.gmWorldbuilderMount = mount;
  window.updateGmWorldbuilderVisibility = updateVisibility;
  window.gmWorldbuilderGenerateStory = generateStory;
  window.gmWorldbuilderGenerateMonster = generateMonster;
  window.gmWorldbuilderAddLevel = addLevel;
  window.gmWorldbuilderAddLocation = addLocation;
  window.gmWorldbuilderAddPortal = addPortal;
  window.gmWorldbuilderAddCharacter = addCharacter;
  window.gmWorldbuilderMoveCharacter = moveCharacter;
  window.gmWorldbuilderGenerateName = generateName;
  window.gmWorldbuilderAddThing = addThing;
  window.gmWorldbuilderTransferThing = transferThing;
  window.gmWorldbuilderAddSticky = function () { addSticky(false); };
  window.gmWorldbuilderAddStickyWithImage = function () { addSticky(true); };
  window.gmWorldbuilderAddChecklist = addChecklist;
  window.gmWorldbuilderToggleChecklist = toggleChecklist;
  window.gmWorldbuilderAddConnection = addConnection;
  window.gmWorldbuilderPullMerchantItem = pullMerchantItem;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
