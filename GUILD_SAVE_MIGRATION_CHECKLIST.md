# Guild Save Migration Checklist

Use this checklist whenever guild-system changes modify persistent state.

## Runtime Migration Rules

- Keep internal renown IDs stable:
  - corporations
  - religious
  - military
  - underworld
  - rebels
  - scholars
- Preserve compatibility with legacy `S.factionStanding` by mirroring/migrating into `S.factionRenown`.
- Preserve compatibility with legacy mission types:
  - `faction_contract` (legacy)
  - `guild_contract` (current)
- Never remove `S.factionNarrative` roots that legacy saves may still depend on.

## Required State Initialization

Ensure these roots always exist before any guild UI rendering:

- `S.factionRenown`
- `S.factionBases`
- `S.factionNarrative`
- `S.factionNarrative.guildCampaigns`

Ensure each guild campaign state includes:

- `joined`
- `guildName`
- `currentArcStage`
- `activeCampaignMissionId`
- `completedQuestIds`
- `earnedPrepOptions`
- `activePrepIds`
- `bossUnlocked`
- `bossDefeated`
- `guildContracts`
- `activeContractMissionId`
- `contractRuns`
- `contractRefreshAt`

## Mission Compatibility

When changing mission metadata, verify:

- Campaign mission metadata still includes `guildCampaign`.
- Boss missions still include `guildBossLayer`.
- Contract missions include `guildContract` metadata and prep summary when available.
- Resolution handlers accept both `faction_contract` and `guild_contract` for story-path contracts.

## Regression Validation

Run these checks before merge:

- Load old save with only `factionStanding` and verify Guild tab renown displays.
- Post and resolve one `guild_campaign` mission.
- Post and resolve one `guild_boss_hunt` mission.
- Post and resolve one repeatable `guild_contract` mission.
- Confirm province map generation still works after mission posting/resolution.
- Confirm wayfarer marker interactions still work after mission posting/resolution.

## Multiplayer Sync Validation

- GM posts a guild campaign mission and players see it in active mission tracker.
- GM posts a guild contract and players see contract mission state transitions.
- Contract completion/failure updates persist after reconnect.
