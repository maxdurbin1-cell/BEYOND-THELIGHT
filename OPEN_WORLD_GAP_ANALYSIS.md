# Open World Gap Analysis

## Executive Assessment

BEYOND: The Light already functions as a good open-world tabletop RPG framework.

It has the core loops required for long-form open-world play:

- free exploration across multiple map layers
- mission generation and multi-step resolution
- faction and ending pathways
- combat, downtime, economy, and caravan/holding progression
- local and multiplayer persistence

What it does not yet do consistently is make major player actions visibly mutate the world. The current implementation is stronger as a rich sandbox and campaign engine than as a fully reactive living world.

The highest-priority work is not adding more tabs. It is making existing systems write back into shared world state in a way players can see on the map, in faction posture, in settlement conditions, and in future content availability.

## Current Strengths

### Freedom and Exploration

- Province travel is phase-based and supports landmarks, barriers, events, perils, trade routes, and mission markers.
- Additional exploration layers already exist for sea, galaxy, World That Was, and planets.
- Backstory anchors and mission tokens can already place player-specific and system-specific markers onto maps.

### Narrative Depth and Choice

- Faction missions support heroic, tyrant, and martyr pathways.
- Faction contracts accumulate pathway points and unlock finale states.
- Rival, faction, ending, and storyline systems already provide a structure for consequence-driven play.

### Mechanics and Progression

- Renown, holdings, caravans, path tokens, augmentations, combat loadouts, and traits all create progression.
- Missions and holdings already gate access to stronger or wider play loops.
- Progression is not just vertical stats; it also includes economy, logistics, and domain play.

### Persistence and Replayability

- Session persistence exists locally.
- Campaign persistence exists on the server.
- Smoke tests already exercise multi-client state sync and generated world surfaces.

## Priority Gaps

## P0: World Consequences Are Not Visible Enough

### Problem

Systems record outcomes, renown, and mission progression, but the world does not yet mutate visibly enough after those outcomes.

### Why it matters

Open-world RPGs feel alive when actions change the world surface the player keeps revisiting. Without that, the game feels like a strong collection of systems rather than a living setting.

### Evidence

- Consequences are frequently reduced to counters, logs, notifications, or internal state.
- Mission and faction systems can record outcomes, but there is not yet a broad, shared projection layer that turns those outcomes into changed map conditions.

### Required change

Create a shared world-state mutation layer that projects outcomes onto:

- hex overlays
- settlement status
- faction control or tension
- route safety
- available missions and merchants
- event tables and encounter weights

## P0: Consequence Logic Is Fragmented Across Systems

### Problem

Missions, faction contracts, holdings, caravans, and exploration all generate meaningful outcomes, but they do so through separate logic paths.

### Why it matters

If each system applies consequences differently, the world will always feel inconsistent. A player should be able to predict that a large action will propagate through the same world model regardless of where it originated.

### Required change

Normalize consequence emission into one schema, then process it through one mutation pipeline.

Suggested normalized event shape:

```js
{
  system: "missions" | "faction" | "holding" | "travel" | "storyline",
  title: "Faction contract succeeded",
  detail: "Heroic delivery chain completed",
  region: "province" | "sea" | "galaxy" | "wtw" | "planet",
  locationKey: "5,8",
  severity: "info" | "medium" | "high" | "critical",
  factionId: "rebels",
  deltas: {
    stability: 1,
    factionHeat: -1,
    rumor: 1,
    routeSafety: 1,
    settlementProsperity: 1
  },
  tags: ["heroic", "trade-route", "visible-map-change"]
}
```

## P1: Factions Need Autonomous World Pressure

### Problem

Factions react when the player touches them, but they do not appear to exert enough independent pressure between player actions.

### Why it matters

An open world becomes believable when power blocs keep moving even when ignored.

### Required change

Add faction turns that periodically:

- contest routes
- pressure settlements
- open or close regional access
- post urgent missions
- move heat between regions
- create allied or rival escalations

## P1: Exploration Persistence Needs Site Memory

### Problem

Players can discover a lot, but locations do not yet preserve enough historical memory.

### Why it matters

Revisiting a place should tell a story about what happened there. Otherwise exploration feels procedural but not consequential.

### Required change

Each notable hex or site should remember:

- discovered secrets
- cleared threats
- failed expeditions
- looted caches
- local faction status
- last major event
- player-built or player-damaged infrastructure

## P1: Mission Variety Needs Broader Structural Templates

### Problem

The three-step mission structure is effective, but overused.

### Why it matters

If every loop resolves through similar beats, the world can feel mission-board driven instead of open-ended.

### Required change

Add mission families that vary structure, not just flavor:

- diplomacy arcs
- mystery investigations
- escort logistics
- faction politics
- survival treks
- settlement recovery
- regional crisis response
- non-combat infiltration

## P2: Progression Should Change Access, Not Just Numbers

### Problem

Progression exists, but not enough of it materially changes how players move through the world.

### Why it matters

Great open-world progression gives new capabilities, permissions, routes, allies, and world interactions.

### Required change

Tie renown, holdings, and faction trust more directly to:

- safe passage rights
- better route intel
- settlement services
- reduced barrier checks
- exclusive world events
- political exemptions
- local militia or caravan support

## P2: The World Needs Better State Readability

### Problem

Even when systems do change, players need to see those changes without digging through multiple tabs.

### Why it matters

A reactive world fails if the player cannot read it.

### Required change

Add clear map and dashboard surfaces for:

- faction influence by region
- unstable or recovering settlements
- blocked or protected routes
- active crises
- recently changed hexes
- unresolved consequence chains

## Pathway Audit

### Fixed

The faction ending-path implementation had an active key mismatch:

- stored data used `martyr`
- parts of the UI and notifications used `sacrificial`

This caused the endings panel and narrative progress messaging to read the wrong property.

The implementation has been normalized to:

- `heroic`
- `tyrant`
- `martyr`

### Additional audit result

No other active logic-path mismatch was found in the faction ending flow after this fix.

Some copy still uses sacrificial language as prose or description, which is acceptable as long as the stored keys remain normalized.

## Design Plan: World State Mutation

## Goal

Make player actions visibly reshape the world map and faction state using the systems that already exist.

## Proposed Architecture

### 1. Add a shared mutable world-state model

Suggested shape:

```js
S.worldState = {
  version: 1,
  regions: {
    province: {
      hexes: {
        "5,8": {
          control: "rebels",
          tension: 2,
          prosperity: 1,
          safety: -1,
          tags: ["recent-conflict", "mission-cleared"],
          lastChange: 1714850000000,
          history: []
        }
      },
      routes: {},
      settlements: {}
    },
    sea: { hexes: {}, routes: {}, settlements: {} },
    galaxy: { hexes: {}, routes: {}, settlements: {} },
    wtw: { hexes: {}, districts: {} },
    planet: { cells: {} }
  },
  factions: {
    rebels: {
      heatByRegion: { province: 1, sea: 0, galaxy: 0 },
      controlByRegion: { province: 2 },
      activeOperations: [],
      posture: "expanding"
    }
  },
  activeCrises: [],
  consequenceFeed: []
};
```

### 2. Create a single consequence applicator

Every major system should emit normalized consequence events. One shared function should apply them.

Suggested responsibilities:

- update world state
- update faction state
- stamp location history
- enqueue map overlays
- alter mission-generation bias
- alter travel risk tables
- write summary feed entries

Suggested entry point:

```js
applyWorldConsequence(event)
```

### 3. Project world state back onto maps

Map rendering should consume world state and visibly show mutations.

Examples:

- faction crest or color ring on hexes under pressure
- route hazard icons on destabilized trade paths
- settlement prosperity or crisis indicators
- recently changed hex glow or marker
- liberated, occupied, quarantined, or ruined statuses

### 4. Make factions run periodic operations

After travel, mission completion, or day advancement, run lightweight faction operations.

Examples:

- secure a route
- retaliate in a region
- seize a settlement
- offer emergency contracts
- move a patrol network
- destabilize a rival-controlled zone

Each operation should emit consequences into the same shared mutation layer.

### 5. Bind mission generation to world state

Mission generation should stop being mostly free-floating.

Instead, bias missions from:

- active crises
- hot regions
- faction control shifts
- recently failed routes
- settlement requests
- unresolved consequence chains

This makes the mission board feel like a response surface for the world instead of a disconnected content deck.

## UI Plan

### Province map

- Add overlay modes for faction influence, danger, prosperity, and recent changes.
- Add changed-hex indicators for the last several world mutations.
- Show a compact hex history in the info panel.

### Missions tab

- Tag missions as crisis-driven, faction-driven, route-driven, or settlement-driven.
- Show which world state generated each contract.

### Factions tab

- Show posture per faction: expanding, weakened, entrenched, negotiating, retaliating.
- Show regional heat and current operations.

### Campaign dashboard

- Add a world feed summarizing the last 10 to 20 mutations.
- Add unresolved consequences requiring player attention.

## Implementation Phases

## Phase 1: Normalize and Persist Consequences

Deliverables:

- add `S.worldState`
- add normalized consequence schema
- route mission, faction, and holding outcomes through one applicator
- persist the resulting state in solo and campaign modes

Success criteria:

- every major mission or faction outcome writes a visible world-state delta

## Phase 2: Province Map Mutation

Deliverables:

- overlay rendering from `worldState`
- hex history
- route safety and settlement condition markers

Success criteria:

- players can identify changed zones directly from the Province map

## Phase 3: Faction Simulation

Deliverables:

- periodic faction operations
- faction posture model
- region heat and control shifts

Success criteria:

- world changes can occur without the player manually opening the Factions tab

## Phase 4: Mission Generation From World State

Deliverables:

- mission templates keyed off crises, regions, and faction operations
- emergency mission posting
- repeatable consequence chains

Success criteria:

- mission board meaningfully reflects current world conditions

## Phase 5: Cross-Map Expansion

Deliverables:

- propagate the same model into sea, galaxy, World That Was, and planet systems
- add region-specific overlays and mutation rules

Success criteria:

- the whole campaign space, not just Province, feels reactive

## Recommended Build Order

1. Fix naming and state consistency bugs first.
2. Add the shared consequence applicator.
3. Make Province visibly mutate before widening scope.
4. Bind faction simulation into that same model.
5. Rework mission generation around world state.
6. Extend the mutation model to the other map layers.

## Definition of Success

This project will feel like a great open-world TTRPG when a player can do all of the following without reading internal state or patch notes:

- point to a region and explain what changed there
- see which faction gained or lost influence
- understand why new missions are appearing
- revisit an old location and find a history of prior actions
- feel that the world continued moving while they were elsewhere
