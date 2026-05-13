# Hex Tile Image Requirements

The renderer now maps **one image to one hex** (no repeated mini-tiles inside a hex).

## Required Format

- **Shape:** Square image only (1:1 ratio).
- **Minimum size:** 256x256.
- **Recommended sizes:** 512x512 or 1024x1024 for cleaner detail.
- **File type:** PNG (preferred), JPG/WebP also work.

## How The Engine Fits Art

- The image is fit to each hex and clipped by the hex polygon.
- If your art ratio is square, you get one coherent image per hex.
- The engine uses center-crop (`xMidYMid slice`), so edges may crop slightly on very tight compositions.

## Asset Creation Tips (for creators / buyers)

- Keep key subject matter inside the center 70-80% of the canvas.
- Avoid putting critical details on extreme edges.
- You do **not** need to draw a visible hex border in the source image.
- Transparent corners are optional now, but still fine to use.

## Quick QA Checklist

Before distributing a pack, verify each asset:

1. Is square (1:1).
2. Is at least 256x256.
3. Main subject is centered.
4. Looks correct on the map with no repeated/tiled fragments.
