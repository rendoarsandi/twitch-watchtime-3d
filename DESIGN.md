# Design System: Twitch 3D Watchtime Architect

## Visual Theme & Register
- **Register**: Product
- **Theme**: High-tech stream command center with isometric 3D architectural viewer.
- **Lighting & Atmosphere**: Studio day / Sunset warm / Cyberpunk night with dynamic directional shadows and ambient occlusion feel.

## Color Palette (OKLCH)
- `--bg`: `oklch(0.12 0.01 270)` — Deep obsidian ground
- `--surface`: `oklch(0.18 0.015 270)` — Slate panel surface
- `--surface-raised`: `oklch(0.24 0.02 270)` — Elevated cards and toolbars
- `--border`: `oklch(0.28 0.025 270)` — Crisp subtle borders
- `--ink`: `oklch(0.98 0 0)` — Crisp white typography
- `--muted`: `oklch(0.72 0.015 270)` — Secondary text
- `--primary`: `oklch(0.62 0.22 285)` — Twitch Electric Amethyst
- `--primary-hover`: `oklch(0.68 0.24 285)` — Vibrant violet hover
- `--accent`: `oklch(0.82 0.18 115)` — Luminous chartreuse green (growth indicator)
- `--accent-cyan`: `oklch(0.75 0.16 200)` — Tech telemetry cyan
- `--accent-gold`: `oklch(0.78 0.17 75)` — VIP milestone gold

## Typography
- Display / Headings: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Code / Metrics: `ui-monospace, "SF Mono", Monaco, "Cascadia Code", "Courier New", monospace`
- Scale:
  - Heading 1: `clamp(1.5rem, 2vw + 1rem, 2.25rem)`
  - Subhead: `1.125rem`
  - Body: `0.9375rem`
  - Micro / Captions: `0.75rem`

## 3D Environment Specifications
- **Render Engine**: Three.js (WebGLRenderer with antialiasing, shadowMap enabled, ACESFilmicToneMapping)
- **Controls**: OrbitControls with damping, clamped polar angles, and smooth target focus
- **Growth Scaling Formulation**:
  - Baseline scale: `1.0`
  - Scale factor: `1.0 + Math.min(3.5, Math.log10(1 + watch_seconds / 60) * 1.25)`
  - Architecture stages:
    - 0m–15m: Cozy Starter Pod / Shack
    - 15m–1h: Suburban Cottage & Patio
    - 1h–5h: 2-Story Modern Residence & Balcony
    - 5h–20h: Luxury Modern Glass Villa & Pool
    - 20h+: Titan Megastructure / Sky Citadel with Energy Beacon
  - Furniture Scaling:
    - Sofas, TVs, Battlestations, Fridges, Beds, Lamps, Trophies, Plants scale continuously and dynamically with animated lerp.
    - Cutaway toggle allows interior viewing at all building sizes.
