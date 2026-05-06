// solo-gm-system.js
(function () {
  var SOLO_SCENES = [
    {
      id: 'tavern',
      title: 'Lanternglass Tavern',
      beats: [
        'You arrive at the tavern as rain stitches silver lines across the windows.',
        'A courier watches your table but pretends to read the menu upside down.',
        'The barkeep wipes the same glass three times and waits for your first move.'
      ],
      choices: [
        { id: 'ask', label: 'Ask the barkeep about rumors', risky: false, stat: 'lead' },
        { id: 'tail', label: 'Tail the courier outside', risky: true, stat: 'adventure' },
        { id: 'read', label: 'Read the courier\'s body language', risky: true, stat: 'mind' }
      ]
    },
    {
      id: 'street',
      title: 'Ashline Crossroads',
      beats: [
        'Fog drifts low over cobblestones and muffles every footstep.',
        'A cart has overturned near a sealed alley, spilling black grain.',
        'A child points to a rooftop and then vanishes into crowdflow.'
      ],
      choices: [
        { id: 'help', label: 'Help lift the cart and listen', risky: false, stat: 'body' },
        { id: 'roof', label: 'Climb to the rooftop line', risky: true, stat: 'body' },
        { id: 'inspect', label: 'Inspect the sealed alley marks', risky: true, stat: 'mind' }
      ]
    },
    {
      id: 'ruin',
      title: 'Subvault Threshold',
      beats: [
        'A cracked stairwell drops beneath the province bedrock.',
        'Faded military stencils warn of pressure traps beyond the third arch.',
        'A lantern guttering in stale air marks where someone turned back.'
      ],
      choices: [
        { id: 'advance', label: 'Advance with caution', risky: true, stat: 'defend' },
        { id: 'probe', label: 'Probe for trap wires', risky: true, stat: 'control' },
        { id: 'withdraw', label: 'Withdraw and circle around', risky: false, stat: 'lead' }
      ]
    }
  ];

  function rollDie(max) {
    if (typeof roll === 'function') return roll(max);
    return 1 + Math.floor(Math.random() * max);
  }

  function statDie(stat) {
    if (typeof getEffectiveDie === 'function') return Math.max(4, Number(getEffectiveDie(stat) || 4));
    if (typeof getStat === 'function') return Math.max(4, Number(getStat(stat) || 4));
    return 6;
  }

  function ensureSoloGMState() {
    if (typeof S === 'undefined' || !S) return null;
    if (!S.soloGM || typeof S.soloGM !== 'object') {
      S.soloGM = {
        active: false,
        sceneIndex: 0,
        beatIndex: 0,
        interactions: 0,
        sinceRoll: 0,
        worldState: { heat: 0, rumor: 0 },
        lastLine: '',
        lastResolution: ''
      };
    }
    return S.soloGM;
  }

  function currentScene(state) {
    return SOLO_SCENES[Math.max(0, Math.min(SOLO_SCENES.length - 1, Number(state.sceneIndex || 0)))] || SOLO_SCENES[0];
  }

  function openSoloGMConsole() {
    var st = ensureSoloGMState();
    if (!st || typeof openModal !== 'function') return false;
    st.active = true;
    var scene = currentScene(st);
    var beat = scene.beats[Math.max(0, Math.min(scene.beats.length - 1, Number(st.beatIndex || 0)))] || scene.beats[0];
    var choiceHtml = scene.choices.map(function (c) {
      return '<button class="btn btn-sm ' + (c.risky ? 'btn-warn' : 'btn-primary') + '" onclick="soloGMChoose(\'' + c.id + '\')">' + c.label + '</button>';
    }).join(' ');

    var html = '<div style="font-size:.82rem;color:var(--text2);line-height:1.58;">'
      + '<div style="font-size:.9rem;color:var(--gold2);margin-bottom:.12rem;"><strong>Solo-GM Mode · ' + scene.title + '</strong></div>'
      + '<div style="margin-bottom:.14rem;">' + beat + '</div>'
      + '<div style="font-size:.69rem;color:var(--muted2);margin-bottom:.14rem;">Narrate → Choose → Risk Roll (every 2-3 interactions) → Resolve → World Update</div>'
      + '<div style="margin-bottom:.14rem;display:flex;gap:.24rem;flex-wrap:wrap;">' + choiceHtml + '</div>'
      + '<div style="margin-bottom:.12rem;">'
      + '<input id="soloGMInput" class="input" placeholder="Say what your character says..." style="width:100%;" />'
      + '</div>'
      + '<div style="display:flex;gap:.24rem;">'
      + '<button class="btn btn-sm" onclick="soloGMSpeak()">Speak</button>'
      + '<button class="btn btn-sm btn-teal" onclick="soloGMAdvanceScene()">Move To Next Scene</button>'
      + '</div>'
      + (st.lastResolution ? '<div style="margin-top:.14rem;font-size:.68rem;color:var(--teal);">Last: ' + st.lastResolution + '</div>' : '')
      + '<div style="margin-top:.08rem;font-size:.66rem;color:var(--muted2);">World Heat: ' + Number(st.worldState.heat || 0) + ' · Rumor: ' + Number(st.worldState.rumor || 0) + '</div>'
      + '</div>';
    openModal('Solo-GM Console', html);
    return true;
  }

  function chooseById(scene, id) {
    var opts = scene && scene.choices ? scene.choices : [];
    for (var i = 0; i < opts.length; i++) {
      if (String(opts[i].id) === String(id)) return opts[i];
    }
    return opts[0] || null;
  }

  function applyFailureConsequence(choice) {
    if (typeof S === 'undefined' || !S) return;
    if (typeof addTMWOnFail === 'function') addTMWOnFail();
    if (choice && choice.stat === 'mind') {
      S.mentalStress = Math.max(0, Number(S.mentalStress || 0) + 2);
    } else {
      S.health = Math.max(0, Number(S.health || 0) - 2);
    }
  }

  function soloGMChoose(choiceId) {
    var st = ensureSoloGMState();
    if (!st) return false;
    var scene = currentScene(st);
    var choice = chooseById(scene, choiceId);
    if (!choice) return false;

    var risky = !!choice.risky;
    if (!risky && st.sinceRoll >= 2) risky = true;
    var success = true;
    var detail = 'Narrative progress.';

    if (risky) {
      var aDie = statDie(choice.stat || 'adventure');
      var dd = 6 + Math.min(6, Math.floor(Number(st.interactions || 0) / 3));
      var a = rollDie(aDie);
      var d = rollDie(dd);
      success = a >= d;
      detail = (choice.stat || 'adventure') + ' d' + aDie + '=' + a + ' vs d' + dd + '=' + d;
      st.sinceRoll = 0;
      if (!success) applyFailureConsequence(choice);
    } else {
      st.sinceRoll += 1;
    }

    st.interactions += 1;
    if (success) {
      st.worldState.rumor = Math.max(0, Number(st.worldState.rumor || 0) + 1);
      st.lastResolution = 'Success: ' + detail;
    } else {
      st.worldState.heat = Math.max(0, Number(st.worldState.heat || 0) + 1);
      st.lastResolution = 'Failure: consequence applied. ' + detail;
    }

    st.beatIndex = (Number(st.beatIndex || 0) + 1) % scene.beats.length;
    if (st.interactions > 20) {
      st.lastResolution = 'Session cadence reached. Move to next scene to avoid loops.';
    }

    return openSoloGMConsole();
  }

  function soloGMSpeak() {
    var st = ensureSoloGMState();
    if (!st) return false;
    var input = document.getElementById('soloGMInput');
    var line = input && typeof input.value === 'string' ? input.value.trim() : '';
    if (!line) {
      st.lastResolution = 'Speak attempt had no line.';
      return openSoloGMConsole();
    }
    st.lastLine = line;
    st.lastResolution = 'You say: "' + line + '". The scene responds and waits for your choice.';
    st.worldState.rumor = Math.max(0, Number(st.worldState.rumor || 0) + 1);
    return openSoloGMConsole();
  }

  function soloGMAdvanceScene() {
    var st = ensureSoloGMState();
    if (!st) return false;
    st.sceneIndex = (Number(st.sceneIndex || 0) + 1) % SOLO_SCENES.length;
    st.beatIndex = 0;
    st.lastResolution = 'Scene shifted.';
    return openSoloGMConsole();
  }

  window.openSoloGMConsole = openSoloGMConsole;
  window.soloGMChoose = soloGMChoose;
  window.soloGMSpeak = soloGMSpeak;
  window.soloGMAdvanceScene = soloGMAdvanceScene;
})();
