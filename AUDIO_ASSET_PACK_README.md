# Optional CC0 Asset Pack Loader

The game now supports an optional recorded audio pack on top of procedural generation.
If the pack is missing, blocked, or partially invalid, the audio manager falls back to generated tracks automatically.

## How To Enable

1. Copy `assets/audio/cc0-pack.example.json` to `assets/audio/cc0-pack.json`.
2. Replace each `src` with a direct URL to a CC0/public-domain audio file.
3. Reload the game.

The loader checks this path by default:
- `/assets/audio/cc0-pack.json`

## Manifest Format

```json
{
  "name": "My CC0 Pack",
  "license": "CC0-1.0",
  "entries": [
    { "id": "music-town", "src": "https://.../town.ogg" },
    { "id": "amb-rain", "src": "https://.../rain.ogg" }
  ]
}
```

- `id`: Any existing track/ambience id (for example `music-town`, `music-space`, `amb-wind`, `amb-rain`).
- `src`: Direct downloadable audio URL (mp3/ogg/wav supported by browser decode).

## Runtime Controls

Open browser console and use:

```javascript
AudioManager.setAssetPackEnabled(true);
AudioManager.setAssetPackManifestUrl('/assets/audio/cc0-pack.json');
AudioManager.loadOptionalAssetPack();
```

## Notes

- The loader is optional and non-breaking.
- Missing entries are ignored.
- Generated procedural music and ambience continue to work as fallback.
- `localStorage` keys used:
  - `beyond-light-audio-asset-pack-enabled`
  - `beyond-light-audio-asset-pack-url`
