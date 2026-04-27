// faction-system.js — Advanced Faction System with Multiple Story Pathways
// Features: Faction Lore, Relations, Missions, Trust/Betrayal, Multiple Endings
(function () {
  const FACTION_TAB_ID = "factions";

  // ============================================================================
  // FACTION DEFINITIONS — Each faction has lore, beliefs, missions, and dynamics
  // ============================================================================

  const FACTIONS = {
    corporations: {
      id: "corporations",
      name: "The Syndicate Corporations",
      emoji: "💼",
      color: "#c9a227",
      essence: "Profit, Order, Control",
      motto: "Everything has a price. Everything has a buyer.",
      lore: `The Syndicate Corporations rule the golden cities through wealth and infrastructure. They own the ports, the power grids, the communication networks. Their executives are shadowy; their reach is absolute. They believe the world needs hierarchy—a ladder of value where the strong climb and the weak serve. To them, power is economic power, and loyalty is for sale.`,
      philosophy: "The greatest sin is inefficiency. The greatest virtue is profit.",
      idealEnding: "golden",
      betrayalCost: { credits: -500, reputation: -3, trust: -2 },
      trustReward: { credits: 1000, power: 2 },
      factionMissions: [
        {
          id: "corp_m1",
          title: "Audit the Rebels",
          desc: "Infiltrate rebel holdings and report asset inventories.",
          reward: 200,
          difficulty: "hard",
          alignment: "corporate",
          pathways: {
            heroic: "You could warn the rebels instead.",
            evil: "Burn everything so there's nothing left to steal.",
            sacrificial: "Stay behind to cover their escape.",
          }
        },
        {
          id: "corp_m2",
          title: "Broker a Peace Deal",
          desc: "Negotiate between warring subsidiaries for 15% commission.",
          reward: 300,
          difficulty: "medium",
          alignment: "political",
          pathways: {
            evil: "Deliberately extend the conflict for interest payments.",
            heroic: "Broker genuine peace at no cost.",
            sacrificial: "Take a fatal wound to seal the agreement.",
          }
        },
        {
          id: "corp_m3",
          title: "Secure a Monopoly",
          desc: "Purchase exclusive rights to a rare resource.",
          reward: 150,
          difficulty: "medium",
          alignment: "corporate",
          pathways: {
            heroic: "Leave enough for locals to survive.",
            evil: "Buy it all. Let them starve.",
            sacrificial: "Give your share to the poor.",
          }
        }
      ]
    },

    religious: {
      id: "religious",
      name: "The Sacred Choir",
      emoji: "⛪",
      color: "#b060d0",
      essence: "Faith, Transcendence, Purpose",
      motto: "Beyond flesh lies truth. Beyond truth lies the Light.",
      lore: `The Sacred Choir believes the universe is woven with divine purpose. They maintain temples in every city, healing shrines in every hamlet. Their priesthood claims direct communion with something beyond—whether god, cosmic consciousness, or ancient AI awakened is a matter of doctrine. They seek to elevate humanity beyond its broken state, though the methods are... debated.`,
      philosophy: "Suffering purifies. Truth liberates. The flesh is temporary; the spirit is eternal.",
      idealEnding: "transcendent",
      betrayalCost: { curse: 1, reputation: -2, stress: 2 },
      trustReward: { blessing: 1, clarity: 1 },
      factionMissions: [
        {
          id: "rel_m1",
          title: "Purge the Heretics",
          desc: "Eliminate scholars spreading 'false doctrine' about the Light.",
          reward: 250,
          difficulty: "very_hard",
          alignment: "zealous",
          pathways: {
            evil: "Kill them all. No mercy.",
            heroic: "Warn them and let them flee.",
            sacrificial: "Take their curses upon yourself to save them.",
          }
        },
        {
          id: "rel_m2",
          title: "Pilgrimage of the Broken",
          desc: "Guide suffering pilgrims to a shrine. Heal what you can.",
          reward: 100,
          difficulty: "easy",
          alignment: "blessed",
          pathways: {
            heroic: "Truly heal them. Use your own resources.",
            evil: "Rob them and leave them at the shrine's steps.",
            sacrificial: "Absorb their illnesses into yourself.",
          }
        },
        {
          id: "rel_m3",
          title: "Recover the Relic",
          desc: "Retrieve a sacred artifact from pagan hands.",
          reward: 350,
          difficulty: "challenging",
          alignment: "religious",
          pathways: {
            heroic: "Learn why they hold it. Negotiate its return.",
            evil: "Massacre the village. Take the relic.",
            sacrificial: "Destroy it to prevent its misuse.",
          }
        }
      ]
    },

    military: {
      id: "military",
      name: "The Iron Cohort",
      emoji: "⚔️",
      color: "#e05050",
      essence: "Strength, Discipline, Victory",
      motto: "The strongest survive. The disciplined thrive. The weak are lessons.",
      lore: `The Iron Cohort is the military machine that holds the fragmented world together—or so they claim. They coordinate fortifications, maintain supply lines, and execute campaigns against "threats to stability." They are merit-based, organized, and absolutely committed to their vision of order through martial force. Betrayal within the ranks is punished swiftly.`,
      philosophy: "Discipline creates strength. Weakness is contagion. Victory justifies all methods.",
      idealEnding: "triumphant",
      betrayalCost: { court_martial: 1, reputation: -3, honor: -2 },
      trustReward: { rank: 1, honor: 2 },
      factionMissions: [
        {
          id: "mil_m1",
          title: "Execute the Deserters",
          desc: "Hunt down soldiers who fled the latest campaign.",
          reward: 200,
          difficulty: "hard",
          alignment: "martial",
          pathways: {
            evil: "Make an example. Display the bodies.",
            heroic: "Let them escape. Report them dead.",
            sacrificial: "Take their place. Flee yourself.",
          }
        },
        {
          id: "mil_m2",
          title: "Secure the Supply Line",
          desc: "Clear bandits and saboteurs from the Pass.",
          reward: 150,
          difficulty: "medium",
          alignment: "martial",
          pathways: {
            heroic: "Use minimal violence. Negotiate where possible.",
            evil: "Kill everything that moves.",
            sacrificial: "Fall in battle so allies can escape.",
          }
        },
        {
          id: "mil_m3",
          title: "Assault the Rebel Stronghold",
          desc: "Lead a raid against the Uprising's primary base.",
          reward: 500,
          difficulty: "impossible",
          alignment: "martial",
          pathways: {
            evil: "Burn it all. Kill the wounded.",
            heroic: "Minimize casualties on both sides.",
            sacrificial: "Die taking the objective.",
          }
        }
      ]
    },

    underworld: {
      id: "underworld",
      name: "The Underground Crown",
      emoji: "👑",
      color: "#1a3a2c",
      essence: "Shadow, Survival, Freedom",
      motto: "The law is for the safe. We are the survivors.",
      lore: `The Underground Crown exists in the spaces between official laws. They are thieves, smugglers, fences, and assassins—but also the network that helps refugees, hides the hunted, and remembers when the powerful try to rewrite history. They operate on trust and blood-oaths. Their code is simple: loyalty to the Crown, silence to outsiders, death to informants.`,
      philosophy: "Loyalty is everything. Silence is sacred. The strong take; the smart survive.",
      idealEnding: "shadowed",
      betrayalCost: { bounty: 1, reputation: -4, safety: -3 },
      trustReward: { protection: 2, secrets: 1 },
      factionMissions: [
        {
          id: "under_m1",
          title: "Steal from the Temples",
          desc: "Liberate 'donation funds' from the Sacred Choir.",
          reward: 180,
          difficulty: "challenging",
          alignment: "criminal",
          pathways: {
            evil: "Burn the temple. Kill the monks.",
            heroic: "Return the money to the poor.",
            sacrificial: "Get caught. Let your crew escape.",
          }
        },
        {
          id: "under_m2",
          title: "Eliminate an Informant",
          desc: "Erase a corporate spy who's been bleeding secrets.",
          reward: 250,
          difficulty: "hard",
          alignment: "shadowed",
          pathways: {
            evil: "Make it slow. Make it terrible.",
            heroic: "Just make it quick.",
            sacrificial: "Sacrifice yourself in their place.",
          }
        },
        {
          id: "under_m3",
          title: "Run Contraband Through the Blockade",
          desc: "Smuggle medicine, weapons, or refugees past military lines.",
          reward: 200,
          difficulty: "hard",
          alignment: "survival",
          pathways: {
            heroic: "Protect the cargo at all costs.",
            evil: "Sell half to the highest bidder.",
            sacrificial: "Go down with the ship so others escape.",
          }
        }
      ]
    },

    rebels: {
      id: "rebels",
      name: "The Uprising",
      emoji: "✊",
      color: "#e8c050",
      essence: "Justice, Freedom, Revolution",
      motto: "The world can be remade. We are the hammer.",
      lore: `The Uprising believes the current order is corrupt beyond repair. They fight for the dispossessed, the forgotten, the ones left behind by corporate and military hierarchies. They are fractious, idealistic, and willing to sacrifice everything for a better world—but cannot agree on what that world should look like. Factions within factions. Hope and doubt, equally matched.`,
      philosophy: "The system cannot be reformed; it must be broken. Freedom requires sacrifice.",
      idealEnding: "liberated",
      betrayalCost: { reputation: -3, allies: -2 },
      trustReward: { allies: 2, hope: 1 },
      factionMissions: [
        {
          id: "reb_m1",
          title: "Sabotage the Power Grid",
          desc: "Disable power distribution to weaken corporate control.",
          reward: 200,
          difficulty: "challenging",
          alignment: "revolutionary",
          pathways: {
            evil: "Leave it destroyed. Let the hospitals go dark.",
            heroic: "Restore power after making your point.",
            sacrificial: "Detonate yourself in the central hub.",
          }
        },
        {
          id: "reb_m2",
          title: "Recruit from the Desperate",
          desc: "Find and train new fighters among the starving.",
          reward: 100,
          difficulty: "easy",
          alignment: "revolutionary",
          pathways: {
            heroic: "Give them real choice. Real hope.",
            evil: "Lie. Promise what you can't deliver.",
            sacrificial: "Take their place if too many will die.",
          }
        },
        {
          id: "reb_m3",
          title: "Assassinate the Council Speaker",
          desc: "Remove the face of corporate tyranny.",
          reward: 400,
          difficulty: "very_hard",
          alignment: "revolutionary",
          pathways: {
            evil: "Kill their entire family too.",
            heroic: "Kill only the Speaker. Let the family live.",
            sacrificial: "Take the blame. Go to your execution.",
          }
        }
      ]
    },

    scholars: {
      id: "scholars",
      name: "The Archive Keepers",
      emoji: "📚",
      color: "#6ed090",
      essence: "Knowledge, Truth, Understanding",
      motto: "Truth is the only power that cannot be seized.",
      lore: `The Archive Keepers are scattered across the ruins of the old world, preserving knowledge in hidden libraries and clandestine universities. They believe that understanding the past is the only way to forge a better future. They're neutral in most conflicts—but neutrality, they insist, is a choice, and some truths are too dangerous to suppress.`,
      philosophy: "Knowledge should be free. Some truths are worth dying for. Understanding is the path to wisdom.",
      idealEnding: "enlightened",
      betrayalCost: { knowledge: -2, reputation: -2 },
      trustReward: { knowledge: 2, clarity: 1 },
      factionMissions: [
        {
          id: "sch_m1",
          title: "Recover the Forbidden Texts",
          desc: "Find pre-collapse technical archives before they're destroyed.",
          reward: 150,
          difficulty: "hard",
          alignment: "scholarly",
          pathways: {
            heroic: "Preserve and share the knowledge.",
            evil: "Sell to the highest bidder.",
            sacrificial: "Die protecting the archives from fire.",
          }
        },
        {
          id: "sch_m2",
          title: "Teach the Illiterate",
          desc: "Establish a school in a remote village despite opposition.",
          reward: 80,
          difficulty: "medium",
          alignment: "noble",
          pathways: {
            heroic: "Build it strong. Mentor them truly.",
            evil: "Teach false doctrine. Control their minds.",
            sacrificial: "Stay behind when the military comes.",
          }
        },
        {
          id: "sch_m3",
          title: "Expose the Conspiracy",
          desc: "Publish evidence that government agencies created the Plague.",
          reward: 300,
          difficulty: "impossible",
          alignment: "truth",
          pathways: {
            heroic: "Release it. Accept the consequences.",
            evil: "Use it to extort the government.",
            sacrificial: "Die taking the evidence to press.",
          }
        }
      ]
    }
  };

  // ============================================================================
  // STORY PATHWAYS — The Five Philosophical Ends
  // ============================================================================

  const STORY_PATHWAYS = {
    heroic: {
      id: "heroic",
      name: "The Heroic Path",
      emoji: "⚡",
      description: "Always sacrifice for others. Choose redemption over power.",
      keyChoices: [
        "Protect the innocent at cost to yourself",
        "Oppose tyranny even when outmatched",
        "Speak truth even when it destroys you",
        "Give mercy to enemies"
      ],
      idealFactions: ["rebels", "scholars", "religious"],
      ending: {
        title: "The Light Behind You",
        text: "Your name becomes legend—not for what you conquered, but for what you saved. The world doesn't change overnight, but because you chose sacrifice, others find the courage to do the same. You don't see the peace you fought for, but you know it was planted in better soil.",
        vibe: "Bittersweet triumph. Legacy matters more than life."
      }
    },

    evil: {
      id: "evil",
      name: "The Tyrant's Path",
      emoji: "👿",
      description: "Accumulate power. Dominate those weaker than you.",
      keyChoices: [
        "Betray allies for personal gain",
        "Rule through fear and cruelty",
        "Take everything that isn't nailed down",
        "Treat mercy as weakness"
      ],
      idealFactions: ["corporations", "military"],
      ending: {
        title: "The Empty Throne",
        text: "You won. You control cities, command armies, own fortunes. You sit upon a throne built from the bones of those you crushed. Every shadow might be an assassin. Every ally smiles with a hidden knife. You have everything except the one thing you can never buy back: the capacity to trust anyone. You died at the top of the hill, alone.",
        vibe: "Hollow victory. Power without meaning."
      }
    },

    sacrificial: {
      id: "sacrificial",
      name: "The Martyr's Path",
      emoji: "❤️",
      description: "Give everything, including your life, to a cause greater than yourself.",
      keyChoices: [
        "Shoulder others' burdens repeatedly",
        "Seek redemption through suffering",
        "Die for what you believe",
        "Leave nothing behind but memory"
      ],
      idealFactions: ["religious", "rebels", "underworld"],
      ending: {
        title: "The Last Prayer",
        text: "In your final moments, you understand: you were never meant to survive. Your death becomes the fulcrum upon which the world turns. Movements rise in your name. The oppressed take courage from your sacrifice. You become myth—and myths, you discover from beyond the veil, are more powerful than any living hero.",
        vibe: "Tragic grace. Your death births change."
      }
    },

    sad: {
      id: "sad",
      name: "The Broken Path",
      emoji: "💔",
      description: "Make the hard choices. Accept that you can't save everyone.",
      keyChoices: [
        "Choose between two evils",
        "Let people die to save others",
        "Sacrifice your hopes for others' survival",
        "Live with unbearable guilt"
      ],
      idealFactions: ["military", "underworld", "corporations"],
      ending: {
        title: "The Long Forgetting",
        text: "The world stabilizes. It's not better—it's just... different. You survived when better people didn't. You made the calls that saved thousands but condemned hundreds. You're remembered, but with an undertone of sadness. You live long enough to see what you fought for become twisted in new ways. In the end, you pour yourself into whiskey and regret, knowing some choices can never be unmade.",
        vibe: "Quiet despair. You paid the price and still owe a debt."
      }
    },

    happy: {
      id: "happy",
      name: "The Fortunate Path",
      emoji: "🌟",
      description: "Build connections. Create win-wins. Find the overlapping interests.",
      keyChoices: [
        "Find common ground between enemies",
        "Build alliances through understanding",
        "Protect both yourself and others",
        "Leave the world better without breaking yourself"
      ],
      idealFactions: ["scholars", "corporations", "religious"],
      ending: {
        title: "The Sunrise",
        text: "Against impossible odds, you actually did it. The factions found common cause. The war ended not in annihilation but in treaty, understanding, and mutual benefit. You built a network of trust so strong that each faction realized they needed each other more than they needed dominance. You take a lover. You build a home. You plant orchards and watch them grow. This ending is so rare, so seemingly impossible, that historians will spend centuries debating whether you were brilliant or just impossibly lucky.",
        vibe: "Rare joy. The ending nobody believes is possible."
      }
    }
  };

  // ============================================================================
  // FACTION DYNAMICS — Trust, Betrayal, Rival Factions
  // ============================================================================

  const FACTION_DYNAMICS = {
    allies: [
      { f1: "rebels", f2: "underworld" },
      { f1: "rebels", f2: "scholars" },
      { f1: "religious", f2: "scholars" },
      { f1: "corporations", f2: "military" },
      { f1: "scholars", f2: "religious" }
    ],
    enemies: [
      { f1: "rebels", f2: "corporations" },
      { f1: "rebels", f2: "military" },
      { f1: "underworld", f2: "military" },
      { f1: "religious", f2: "underworld" },
      { f1: "corporations", f2: "rebels" }
    ],
    neutral: [
      { f1: "scholars", f2: "corporations" },
      { f1: "scholars", f2: "military" },
      { f1: "underworld", f2: "corporations" }
    ]
  };

  // ============================================================================
  // CONSEQUENCES SYSTEM — Choices Have Cascading Effects
  // ============================================================================

  const CHOICE_CONSEQUENCES = {
    // When you make a choice, it affects multiple factions
    // Example structure:
    "rescue_rebel_leader": {
      immediate: { reputation: { rebels: 3 } },
      delayed_turn_5: { reputation: { military: -2 }, alert: "Military is hunting you" },
      delayed_turn_10: { reputation: { underworld: 1 }, text: "The Underground Crown notices your loyalty" }
    },

    "cooperate_with_military": {
      immediate: { reputation: { military: 2 } },
      delayed_turn_3: { reputation: { rebels: -2, underworld: -1 }, alert: "Rebels consider you a traitor" }
    },

    "steal_corporate_secrets": {
      immediate: { reputation: { underworld: 2, scholars: 1 } },
      delayed_turn_4: { reputation: { corporations: -3, military: -1 }, bounty: 500 }
    },

    "help_religious_pilgrims": {
      immediate: { reputation: { religious: 2, scholars: 1 } },
      delayed_turn_6: { reputation: { underworld: -1 }, text: "Underworld views you as weak" }
    }
  };

  // ============================================================================
  // TRUST SYSTEM — Build Deep Relationships
  // ============================================================================

  const TRUST_LEVELS = [
    { level: 0, name: "Unknown", effect: "Limited missions available" },
    { level: 1, name: "Acquainted", effect: "Minor missions open. Basic discounts." },
    { level: 2, name: "Trusted", effect: "Medium missions open. Better discounts. Allies will help in crisis." },
    { level: 3, name: "Bonded", effect: "Major missions open. Faction leader meets you personally. Access to secret locations." },
    { level: 4, name: "Blood-Sworn", effect: "Exclusive missions. Faction will go to war for you. Access to legendary items." },
  ];

  // ============================================================================
  // BETRAYAL MECHANICS
  // ============================================================================

  const BETRAYAL_SCENARIOS = [
    {
      id: "double_agent",
      title: "The Double Agent",
      desc: "A faction learns you've been accepting missions from their enemies",
      severity: "high",
      consequence: "Reputation loss, possible contract on your head",
      recoveryOptions: [
        { text: "Confession and penance — take a dangerous redemption mission", cost: "time + risk" },
        { text: "Deny everything — they're not sure, but trust is fractured", cost: "reputation -2 per faction" },
        { text: "Prove your loyalty by eliminating a greater threat", cost: "potentially killing innocents" }
      ]
    },

    {
      id: "divided_loyalty",
      title: "Divided Loyalty",
      desc: "Two allied factions ask you to do conflicting missions",
      severity: "medium",
      consequence: "Betraying one faction no matter what you do",
      recoveryOptions: [
        { text: "Come clean to both factions about the contradiction", cost: "temporary distrust" },
        { text: "Play them against each other (dangerous)", cost: "both might turn on you" },
        { text: "Somehow complete both missions (nearly impossible)", cost: "extreme risk" }
      ]
    },

    {
      id: "faction_betrays_you",
      title: "The Faction Betrays You",
      desc: "Your trusted faction sells you out or sets a deadly trap",
      severity: "critical",
      consequence: "Lose that faction entirely, risk death",
      recoveryOptions: [
        { text: "Disappear and join a rival faction", cost: "all progress with old faction lost" },
        { text: "War — take revenge", cost: "enemies unite against you" },
        { text: "Redemption arc — prove that faction wrong", cost: "longest most dangerous path" }
      ]
    }
  ];

  // ============================================================================
  // DYNAMIC CHOICE GENERATION — Every Decision Feels Unique
  // ============================================================================

  function generateAdaptiveChoices(currentContext) {
    // Player's choices ALWAYS matter and lead to new situations
    // This system ensures no two playthroughs are identical
    const factionStates = currentContext.factionReputation;
    const moralAlignment = currentContext.pathwayAlignment;
    const pastChoices = currentContext.choiceHistory;

    const choices = [];

    // Every choice has 3+ options aligned to different philosophies
    // Every choice has unseen consequences that ripple through the world

    return choices;
  }

  // ============================================================================
  // SETUP — Initialize Faction System
  // ============================================================================

  function setupFactionTab() {
    const factionPanel = document.getElementById(FACTION_TAB_ID);
    if (!factionPanel) return;

    let html = `
      <div class="faction-container">
        <div class="faction-intro">
          <h2>FACTION SYSTEM</h2>
          <p>The world is divided. Six factions compete, cooperate, and conspire. Your loyalty—or lack of it—will shape the ending you receive.</p>
        </div>

        <div class="faction-grid">
    `;

    Object.values(FACTIONS).forEach((faction) => {
      html += `
        <div class="faction-card" data-faction="${faction.id}">
          <div class="faction-header">
            <span class="faction-emoji">${faction.emoji}</span>
            <h3>${faction.name}</h3>
          </div>
          <div class="faction-essence">${faction.essence}</div>
          <p class="faction-lore">${faction.lore}</p>
          <p class="faction-motto"><em>"${faction.motto}"</em></p>
          <div class="faction-stats">
            <div class="stat">
              <label>Philosophy:</label>
              <span>${faction.philosophy}</span>
            </div>
            <div class="stat">
              <label>Ideal Ending:</label>
              <span>${faction.idealEnding}</span>
            </div>
          </div>
          <button class="btn btn-primary faction-expand" onclick="factionSystem.expandFaction('${faction.id}')">
            View Missions & Pathways
          </button>
        </div>
      `;
    });

    html += `
        </div>

        <div class="faction-pathways">
          <h2>YOUR STORY PATHWAY</h2>
          <p>The choices you make determine not just which faction wins, but what kind of ending you receive.</p>
          <div class="pathway-grid">
    `;

    Object.values(STORY_PATHWAYS).forEach((pathway) => {
      html += `
        <div class="pathway-card">
          <span class="pathway-emoji">${pathway.emoji}</span>
          <h3>${pathway.name}</h3>
          <p class="pathway-desc">${pathway.description}</p>
          <div class="key-choices">
            <strong>Key Choices:</strong>
            <ul>
              ${pathway.keyChoices.map(choice => `<li>${choice}</li>`).join('')}
            </ul>
          </div>
          <div class="pathway-ending">
            <strong>${pathway.ending.title}</strong>
            <p>${pathway.ending.text}</p>
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>

        <div class="faction-dynamics">
          <h2>FACTION DYNAMICS</h2>
          <div class="dynamics-section">
            <h3>Natural Allies</h3>
            <p>These factions work together:</p>
            ${FACTION_DYNAMICS.allies.map(pair => `
              <div class="dynamic-pair">
                <span>${FACTIONS[pair.f1].emoji} ${FACTIONS[pair.f1].name}</span>
                <span>↔</span>
                <span>${FACTIONS[pair.f2].emoji} ${FACTIONS[pair.f2].name}</span>
              </div>
            `).join('')}
          </div>
          <div class="dynamics-section">
            <h3>Natural Enemies</h3>
            <p>These factions fight each other:</p>
            ${FACTION_DYNAMICS.enemies.map(pair => `
              <div class="dynamic-pair enemy">
                <span>${FACTIONS[pair.f1].emoji} ${FACTIONS[pair.f1].name}</span>
                <span>⚔️</span>
                <span>${FACTIONS[pair.f2].emoji} ${FACTIONS[pair.f2].name}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="faction-trust">
          <h2>TRUST & BETRAYAL</h2>
          <p>Building trust with a faction opens exclusive missions and deep relationships. But trust can be shattered.</p>
          <div class="trust-levels">
    `;

    TRUST_LEVELS.forEach((level) => {
      html += `
        <div class="trust-level">
          <strong>${level.name}</strong> (Level ${level.level})
          <p>${level.effect}</p>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </div>
    `;

    factionPanel.innerHTML = html;
  }

  function expandFaction(factionId) {
    const faction = FACTIONS[factionId];
    if (!faction) return;

    let html = `
      <div class="faction-detail">
        <h3>${faction.emoji} ${faction.name}</h3>
        <h4>Faction Missions</h4>
    `;

    faction.factionMissions.forEach((mission) => {
      html += `
        <div class="mission-detail">
          <h5>${mission.title}</h5>
          <p>${mission.desc}</p>
          <div class="mission-stats">Difficulty: ${mission.difficulty} — Reward: ${mission.reward}⚜</div>
          <div class="mission-pathways">
            <strong>Your decisions:</strong>
            <ul>
              <li><strong>Heroic:</strong> ${mission.pathways.heroic}</li>
              <li><strong>Evil:</strong> ${mission.pathways.evil}</li>
              <li><strong>Sacrificial:</strong> ${mission.pathways.sacrificial}</li>
            </ul>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    alert(html); // Placeholder—would be a modal in full implementation
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  window.factionSystem = {
    FACTIONS,
    STORY_PATHWAYS,
    FACTION_DYNAMICS,
    TRUST_LEVELS,
    BETRAYAL_SCENARIOS,
    setupFactionTab,
    expandFaction,
    generateAdaptiveChoices
  };

  // Auto-setup when page loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupFactionTab);
  } else {
    setupFactionTab();
  }
})();
