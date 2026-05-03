# Solar Cycle Solo Mode - Copilot Build Prompt

Use this prompt with GitHub Copilot Chat in Agent mode.

## Prompt to paste into Copilot

You are implementing a new solo game mode for BEYOND-THELIGHT called "Solar Cycle: 100 Days to the New Sun".

Important narrative constraints:
- Keep the tone inspired by dying-sun fiction and mythic decay.
- Do not copy prose, names, or passages from copyrighted works.
- Build original lore, dialogue, events, and endings.

Core fantasy:
- The player has 100 in-game days before a terminal solar event.
- The run starts in Province, then moves through Last Sea, World That Was, and Space.
- The player seeks either:
  1) a relic that can alter the ending,
  2) a person tied to the New Sun,
  3) or a time-loop method that rewrites fate.
- Choices can save the world, doom it, or trigger a transformed "New Sun" ending.

Use the existing M.A.D. mechanics and existing systems. Do not rebuild the game from scratch.

## Implementation requirements

1) Add a dedicated solo mode state object
- Add `S.solarCycle` with at least:
  - `enabled` (bool)
  - `startDayKey` (string from current game date)
  - `daysElapsed` (0-100)
  - `daysRemaining` (derived)
  - `worldTilt` (number/intensity band)
  - `prophecyTrack` (array of unlocked omens)
  - `echoSeed` (number)
  - `activeArc` ("relic" | "herald" | "loop")
  - `resolvedMarkers` (map of marker id -> choice)
  - `endingFlags` (object)
  - `timeFracture` (object for limited rewind mechanics)

2) Hook into date progression
- Integrate with existing date/time systems in stars-expansion.js:
  - `S.gameDate`
  - `advanceDay(...)`
  - `registerStarshipTravelDays(...)`
- Every day increment should call a new function like `progressSolarCycleDay()` when mode is enabled.
- If `daysElapsed >= 100`, trigger a forced finale event chain.

3) Add "reality tilt" behavior by day
- Implement day-reactive world mutations:
  - Certain hex markers appear only in day windows.
  - Some known hexes mutate based on day tiers (early, mid, late).
  - Repeatable events return as "echoes" with altered text and consequences.
- Example pattern to implement:
  - Early window: abandoned lighthouse.
  - Mid window: same hex active, keeper recognizes player.
  - Late window: structure gone, only light remains.
- Store this in data tables, not hardcoded one-off branches.

4) Add hex quest markers with branching outcomes
- Reuse mission token infrastructure:
  - `S.missionTokens`
  - `S.lastSea.missionTokens`
  - map `taskSite` patterns where useful.
- Markers must resolve permanently on interaction, then branch by approach:
  - Observe: lore gain, future unlocks.
  - Intervene: faction/world-state changes.
  - Ignore: marker migrates or mutates elsewhere later.
- After interaction, remove original marker and place follow-up state-driven marker if appropriate.
- Ensure `renderHexMap()` refreshes consistently.

5) Integrate with storyline and missions tabs
- Add a Storyline-facing panel for Solar Cycle status:
  - Day counter, current omen, active arc, and next clue region.
- Integrate with mission flow rather than replacing it:
  - At least 6 new mission templates distributed across Province, Last Sea, World That Was, and Space.
  - Include step-based progression compatible with current mission loop.
- Add at least 3 major branch points and 6+ endings total.

6) Dialogue and NPC mutation by day count
- Add NPC dialogue variants keyed to day tiers and selected arc.
- Dialogue should acknowledge prior interactions and resolved markers.
- Include "echo degradation" where repeated encounters become less stable and more uncanny over time.

7) Time fracture (limited rewind)
- Add a constrained rewind mechanic (not full reset):
  - Can rewind a small number of days under specific conditions.
  - Rewind keeps memory scars: some flags persist to prevent exploit loops.
  - Rewind changes available branches rather than simply undoing all outcomes.

8) UX and discoverability
- Add a clear mode toggle/start in solo-facing flow.
- Add concise helper text in Solo Reference panel explaining:
  - 100-day pressure
  - marker interpretation choices
  - rewind limits
- Add notifications for major day thresholds (ex: day 25/50/75/90).

## File integration targets

Use these files as primary integration points:
- `storyline-system.js` (new arc scenes, branch logic, mode panel)
- `storyline-choices-system.js` (choice ripple integration)
- `missions-system.js` (mission templates and progression hooks)
- `task-and-exploration-system.js` (hex task/marker interactions)
- `stars-expansion.js` (calendar/day progression hooks and travel-day integration)
- `solo-reference.js` (new quick-reference section)

Only add new files if necessary. Prefer extending existing systems.

## Data design guidance

Implement data-driven tables for:
- day-tier thresholds
- map-region omen pools
- marker interaction outcomes
- recurring echo event variants
- ending conditions

Avoid giant monolithic functions. Add focused helpers and keep side effects explicit.

## Acceptance criteria

Functional:
- Starting Solar Cycle mode initializes state correctly.
- Advancing days updates mode state and triggers day-tier content.
- Marker interaction removes marker and applies branch-specific consequences.
- At day 100, finale sequence always fires.
- At least one path reaches each of: doom ending, salvation ending, transformed New Sun ending.

Narrative:
- Tone is coherent, strange, and original.
- Recurring events show meaningful mutation over time.
- NPC dialogue changes by day tier and previous choices.

Technical:
- No regressions to existing mission loop, map rendering, or save/load behavior.
- New state is save-safe and backward compatible with older saves.
- Guard null/undefined checks for optional systems.

## Minimum test checklist

- Start a fresh solo run with Solar Cycle enabled.
- Confirm day counter increments from normal day advancement and star travel advancement.
- Trigger at least one marker each in Province, Last Sea, World That Was, and Space.
- Validate Observe vs Intervene vs Ignore produce different downstream states.
- Validate rewind limits and persistent scar flags.
- Simulate day 100 and confirm finale branch resolution.

Now implement this incrementally in small, reviewable commits with clear function boundaries.
