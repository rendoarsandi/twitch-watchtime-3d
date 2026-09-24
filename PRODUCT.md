# Product: Twitch 3D Watchtime Architect

## Register

product

## Users
Twitch streamers, moderators, community managers, and viewers/chatters who want to visualize and celebrate stream loyalty and watch time in real-time through an interactive 3D virtual house and megastructure.

## Product Purpose
Twitch does not have an official native API for cumulative user watch time. This application bridges that gap with a multi-tiered tracking engine (anonymous Twitch IRC WebSocket presence, chat activity tracking, Helix API polling fallback, and time-simulation controls). It transforms estimated watch time into an interactive 3D Three.js environment where a chatter's house physically expands from a cozy starter shack into an opulent multi-story mansion and mega-citadel, while interior furniture (sofas, battlestations, TVs, fridges, beds, chandeliers, trophy displays) balloons in scale to comical, glorious epic proportions.

## Brand Personality
Energetic, architectural, gamified, tactile, precise. Evokes the thrill of leveling up in an RPG combined with the satisfying isometric delight of SimCity and Animal Crossing.

## Anti-references
- No generic purple AI gradients or mushy cards.
- No static flat tables without visual feedback.
- No slow, clunky 3D models with missing textures; fast 60fps procedural Three.js geometry with polished lighting, shadows, and smooth spring physics.

## Design Principles
1. **Show Physical Growth**: Watch time shouldn't just be an abstract number; every minute earned visibly expands the physical architecture and magnifies the furniture.
2. **Instant Gratification & Demoability**: Works out of the box with zero required Twitch tokens via anonymous IRC and built-in interactive time simulation, while supporting real channels seamlessly.
3. **Streamer-Ready Utility**: Beautiful as an interactive desktop tool and usable directly as a transparent OBS browser source overlay.
4. **Resilient Watch Time Heuristics**: Combine chat activity, IRC presence, and periodic heartbeat checks to build a trustworthy watch time log without a native API.

## Accessibility & Inclusion
- High contrast (>7:1 ink-on-background contrast) for readability.
- Clear numeric tooltips and labels alongside 3D visuals.
- Keyboard navigation and accessible controls for camera and UI tabs.
- Reduced-motion consideration (respects prefers-reduced-motion for UI transitions).
