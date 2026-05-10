// intro-system.js — Game Intro & Onboarding
// Presents an immersive introduction before entering the main game
(function () {
  const INTRO_ID = "intro";

  const INTRO_CONTENT = {
    screens: [
      {
        id: "welcome",
        title: "BEYOND: The Light",
        subtitle: "A Game of Choices, Factions, and Consequences",
        content: `
In a world where civilization has fractured into competing powers, you are nobody—
yet, a catalyst. The decisions you make ripple outward, changing lives, toppling empires, 
and shaping the very nature of humanity's future.

This is not a game about winning. This is a game about what you're willing to sacrifice 
to get what you want.
        `,
        background: "linear-gradient(135deg, #0a1a2e 0%, #16213e 50%, #0f3460 100%)",
        next: "core_premise"
      },

      {
        id: "core_premise",
        title: "The World",
        subtitle: "Fractured and Desperate",
        content: `
Once, there was a unified civilization. Then came the Collapse—a cascade of failures, 
wars, and betrayals. Now, the remnants fight for control:

The CORPORATIONS control wealth and infrastructure. Everything has a price.

The SACRED CHOIR believes they alone hear truth. They heal the sick, but demand conformity.

The IRON COHORT maintains order through military strength. Discipline is sacred.

The UNDERGROUND CROWN survives in shadow, helping the forgotten while profiting from chaos.

The UPRISING fights for revolution, willing to burn everything down for a chance at justice.

The ARCHIVE KEEPERS preserve knowledge, neutral yet choosing sides where it matters most.

Each faction is not evil or good. Each simply believes their way is the only way forward.
        `,
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        next: "your_role"
      },

      {
        id: "your_role",
        title: "Your Role",
        subtitle: "The Wayfarer",
        content: `
You arrived when the tensions were highest—a traveler, a outsider, unclaimed by any faction. 
For the first time in generations, it's possible for one person to build lasting bridges between 
the fractured groups... or burn them all to ash.

Every person you meet will remember you.
Every choice you make will have consequences that extend far beyond the immediate.
Every faction will try to claim you, corrupt you, or eliminate you.

You can:
• Build genuine alliances across enemy lines
• Play factions against each other for personal gain
• Sacrifice everything for a single cause
• Walk a middle path and try to hold it all together
• Become a legendary hero, a feared tyrant, or a tragic martyr

The game does not judge your choices. 
The game only ensures that they matter.
        `,
        background: "linear-gradient(135deg, #0a2a4e 0%, #16213e 50%, #1f3460 100%)",
        next: "pathway_intro"
      },

      {
        id: "pathway_intro",
        title: "Your Story Path",
        subtitle: "Five Possible Endings",
        content: `
As you play, your decisions will paint a picture of what you value. 
The game's final chapter will reflect the person you've become:

THE HEROIC PATH ⚡
Always sacrifice for others. Oppose tyranny. Speak truth.
Ending: A legend—your name becomes inspiration.

THE TYRANT'S PATH 👿
Accumulate power. Dominate. Take what you can take.
Ending: The empty throne—power without meaning.

THE MARTYR'S PATH ❤️
Give everything. Shoulder burdens. Die for your cause.
Ending: Your death becomes the turning point of history.

THE BROKEN PATH 💔
Choose between evils. Accept that you can't save everyone.
Ending: Quiet despair. You survived, but at what cost?

THE FORTUNATE PATH 🌟
Find common ground. Build alliances through understanding.
Ending: Peace. Actual, improbable, beautiful peace.

You don't choose your path at the start. Your path emerges from what you DO.
        `,
        background: "linear-gradient(135deg, #0f1a3e 0%, #16213e 50%, #1a2a4e 100%)",
        next: "mechanics"
      },

      {
        id: "mechanics",
        title: "How It Works",
        subtitle: "Meaningful Choices",
        content: `
Every mission from every faction has multiple approaches:

When defending against assassins, you could:
→ Heroic: Protect innocents at risk to yourself
→ Evil: Use civilians as human shields
→ Sacrificial: Take a fatal wound so others escape

YOUR REPUTATION MATTERS
Work with the Corporations enough, and they offer exclusive missions.
Build reputation with the Rebels, and you might participate in a coup.
Trust spreads across allied factions, but reaches rivals too.

BETRAYAL HAS TEETH
Accept a mission from enemies of your allies? 
Your trusted faction learns of it. They'll demand loyalty or exile you.
You can escape the consequences temporarily, but not forever.

CHOICE CASCADES
A decision early in the game might not matter until 10 hours later,
when a faction suddenly references your past and adjusts their strategy.
Nothing is forgotten. Nothing is forgiven. Everything compounds.

NO SAVE SCUMMING
You play in IRON MAN mode. No reloading to undo consequences.
Every choice stands. Every betrayal echoes.
This is your story, told only once.

(You can replay and make different choices—but each playthrough is permanent.)
        `,
        background: "linear-gradient(135deg, #1a0f2e 0%, #16213e 50%, #0f2a5e 100%)",
        next: "tone"
      },

      {
        id: "tone",
        title: "The Tone",
        subtitle: "What You're In For",
        content: `
This is a game of:

CONSEQUENCE
Every choice has weight. NPC deaths matter. Faction wars change the world.
You will feel the burden of your decisions.

MORAL AMBIGUITY
There are no truly good factions. Each has valid points and terrible methods.
You build your own moral philosophy through play.

DARK AESTHETICS
Noir frontier gothic. Decay and beauty intertwined.
Cinematic music, environmental storytelling, and a world that feels lived-in.

PLAYER AGENCY
You shape the world. The factions adapt to you.
No railroad. No "correct" path. Your story is yours to tell.

HIGH STAKES
Alliances rise and fall. Characters die. Factions war.
The world changes because of what you do.

But also:
MOMENTS OF GENUINE CONNECTION
NPCs you help remember you. Factions you preserve evolve.
The world is dark, but not nihilistic. Meaning exists in what you choose.
        `,
        background: "linear-gradient(135deg, #2a1a3e 0%, #16213e 50%, #0a1a4e 100%)",
        next: "character_creation"
      },

      {
        id: "character_creation",
        title: "Ready?",
        subtitle: "Create Your Wayfarer",
        content: `
Everything that follows is your story.

The factions are waiting.
The world is changing.
Your choices will echo through history.

Enter the game.
        `,
        background: "linear-gradient(135deg, #000a1a 0%, #0f1a3e 50%, #1a2a5e 100%)",
        next: "game_start"
      }
    ]
  };

  function createIntroPage() {
    const introContainer = document.getElementById(INTRO_ID);
    if (!introContainer) return;

    let html = `<div class="intro-wrapper">`;

    INTRO_CONTENT.screens.forEach((screen, index) => {
      html += `
        <div class="intro-screen" data-screen="${screen.id}" style="background: ${screen.background}">
          <div class="intro-content">
            <h1 class="intro-title">${screen.title}</h1>
            <h2 class="intro-subtitle">${screen.subtitle}</h2>
            <div class="intro-text">
              ${screen.content.split('\n').map(line => `<p>${line.trim()}</p>`).join('')}
            </div>
          </div>
          <div class="intro-footer">
            <div class="intro-nav">
              ${index > 0 ? `<button class="btn btn-sm intro-prev" onclick="introSystem.prevScreen()">← BACK</button>` : `<button class="btn btn-sm btn-red" onclick="introSystem.skipIntro()">SKIP INTRO</button>`}
              ${index < INTRO_CONTENT.screens.length - 1 ? `
                <button class="btn btn-primary intro-next" onclick="introSystem.nextScreen()">NEXT →</button>
              ` : `
                <button class="btn btn-primary intro-start" onclick="introSystem.startGame()">ENTER THE WORLD</button>
              `}
            </div>
            <div class="intro-progress">
              ${Array.from({length: INTRO_CONTENT.screens.length}).map((_, i) => 
                `<span class="progress-dot ${i <= index ? 'active' : ''}"></span>`
              ).join('')}
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    introContainer.innerHTML = html;
    showScreen("welcome");
  }

  let currentScreenIndex = 0;

  function showScreen(screenId) {
    document.querySelectorAll(".intro-screen").forEach(s => s.style.display = "none");
    const screen = document.querySelector(`[data-screen="${screenId}"]`);
    if (screen) {
      screen.style.display = "flex";
      currentScreenIndex = INTRO_CONTENT.screens.findIndex(s => s.id === screenId);
    }
  }

  function nextScreen() {
    if (currentScreenIndex < INTRO_CONTENT.screens.length - 1) {
      currentScreenIndex++;
      showScreen(INTRO_CONTENT.screens[currentScreenIndex].id);
    }
  }

  function prevScreen() {
    if (currentScreenIndex > 0) {
      currentScreenIndex--;
      showScreen(INTRO_CONTENT.screens[currentScreenIndex].id);
    }
  }

  function startGame() {
    hideIntroOverlay();
    if (isSoloModeEnabled()) {
      promptSoloEntryMode();
      return;
    }
    enterLegacyMode();
  }

  function hideIntroOverlay() {
    const introContainer = document.getElementById(INTRO_ID);
    if (introContainer) {
      introContainer.style.display = "none";
    }
  }

  function isSoloModeEnabled() {
    if (window.settingsSystem && typeof window.settingsSystem.isSoloMode === 'function') {
      try { return !!window.settingsSystem.isSoloMode(); } catch (_err) {}
    }
    if (window.settingsSystem && window.settingsSystem.Settings) {
      var gm = String(window.settingsSystem.Settings.gameMode || 'solo');
      return gm === 'solo';
    }
    return true;
  }

  function switchToTabSafe(tabId) {
    if (typeof window.switchTab !== 'function') return;
    var btn = document.getElementById('tabnav-' + String(tabId || ''));
    window.switchTab(String(tabId || ''), btn || null);
  }

  function enterLegacyMode() {
    switchToTabSafe('character');
    if (typeof showNotif === 'function') {
      showNotif('Legacy Mode initialized.', 'good');
    }
  }

  function enterKnownRealmMode() {
    if (window.settingsSystem && typeof window.settingsSystem.setGameMode === 'function') {
      try { window.settingsSystem.setGameMode('solo'); } catch (_err) {}
    }
    switchToTabSafe('theos');
    if (typeof showNotif === 'function') {
      showNotif('The Known Realm initialized. Use Last Sea routes to reach additional continents.', 'good');
    }
  }

  function promptSoloEntryMode() {
    if (typeof openModal !== 'function') {
      enterLegacyMode();
      return;
    }

    var html = ''
      + '<div style="font-size:.86rem;color:var(--text2);line-height:1.58;">'
      + 'Solo Mode detected. Choose your starting campaign frame.'
      + '<div style="margin-top:.42rem;font-size:.76rem;color:var(--muted2);">'
      + '<strong>Legacy Mode:</strong> classic character-first loop and mission progression.<br>'
      + '<strong>The Known Realm:</strong> start in Theos Atlas and branch to outer continents through the Last Sea.'
      + '</div>'
      + '<div style="margin-top:.65rem;display:flex;gap:.4rem;justify-content:flex-end;flex-wrap:wrap;">'
      + '<button class="btn btn-sm" onclick="if(typeof closeModal===\'function\')closeModal();if(window.introSystem&&typeof window.introSystem.enterLegacyMode===\'function\')window.introSystem.enterLegacyMode();">Legacy Mode</button>'
      + '<button class="btn btn-sm btn-primary" onclick="if(typeof closeModal===\'function\')closeModal();if(window.introSystem&&typeof window.introSystem.enterKnownRealmMode===\'function\')window.introSystem.enterKnownRealmMode();">The Known Realm</button>'
      + '</div>'
      + '</div>';
    openModal('Choose Solo Entry', html);
  }

  function skipIntro() {
    if (typeof showNotif === 'function') {
      showNotif('Skipping intro...', 'good');
    }
    startGame();
  }

  window.introSystem = {
    createIntroPage,
    nextScreen,
    prevScreen,
    startGame,
    skipIntro,
    enterLegacyMode,
    enterKnownRealmMode
  };

  // Auto-setup
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createIntroPage);
  } else {
    createIntroPage();
  }
})();
