# Twitch 3D Watch Time Architect & Expanding Furniture Environment

An interactive, real-time 3D Three.js environment that calculates and visualizes Twitch viewer watch time. As a chatter earns more watch time, their house physically expands from a cozy starter shack into an opulent multi-story mansion and titan citadel, while their interior furniture (couch, battlestation, TV, fridge, bed, trophies, chandelier, bonsai) balloons into comical, epic colossal proportions.

---

## Why Twitch Doesn't Have a Dedicated Watch Time API
Twitch's official Helix API does not provide a native or cumulative "watch time" metric for viewers. Official endpoints only provide broadcaster stream status, follower lists, or a transient active chatter list (which is strictly restricted behind user-authorized OAuth tokens).

### How This Project Accurately Tracks Watch Time
1. **Anonymous Twitch IRC WebSocket Connection**: Connects to Twitch Chat via `wss://irc-ws.chat.twitch.tv:443` using the standard anonymous protocol (`NICK justinfan<rand>`). Requires **zero streamer credentials or OAuth** to start tracking any public Twitch channel immediately.
2. **Lurker & Active Presence Detection via RPL_NAMREPLY (353)**: Captures room membership presence via IRC numeric `353` on join and periodic `NAMES #${channel}` polling. Detects passive lurkers without requiring them to chat.
3. **Active Message & Inactivity Window**: Every chatter sending messages (`PRIVMSG`), joining (`JOIN`), or interacting has their activity window maintained. Inactive viewers accurately time out after 15 minutes of silence.
4. **Twitch USERNOTICE Subscriptions**: Real-time parsing of subscriptions, resubs, and raids, awarding celebratory loyalty watch time bonuses and triggering milestones.
5. **Twitch GQL Live Broadcast Detection**: Automatically queries public Twitch GQL (`https://gql.twitch.tv/gql`) for live broadcast status, game category, title, and live viewer count. Supports optional `LIVE ONLY` tracking mode.
6. **Continuous Heartbeat Accumulator**: Real-time ticker computes elapsed active watch seconds, upgrading tiers and scaling architecture and furniture with every tick.
7. **Time Multiplier & Simulation Controls**: For demonstration, testing, and streamer events, speed multipliers (`1x`, `10x`, `60x`, `300x`, `1000x`) and automated simulated Twitch chatter traffic are built right in.
8. **Channel-Scoped Data Persistence**: All chatter watch times, levels, and chat histories are saved automatically to `./data/watchtime_<channel>.json`.

---

## 3D Three.js Architecture & Furniture Evolution

### 1. Continuous House & Building Scaling ("The House Gets Bigger")
Rather than remaining frozen between discrete tier levels, the house physically and continuously expands in 3D with every second of watch time via `calculateHouseScale(watchSeconds)`:
- `0m`: 1.00x Starter Cabin
- `15m`: 1.35x Cozy Cottage
- `1h`: 1.80x Two-Story Residence
- `5h`: 2.30x Modern Glass Villa
- `20h+`: 3.00x – 6.00x Monumental Titan Sky Citadel
Within each tier, the building smoothly and continuously grows outward and upward. In Tier 3, cutaway mode reveals both floors cleanly.

### 2. The 8 Hyper-Scaling Furniture Pieces ("Furniture Gets Huge")
Every furniture piece starts at cozy realistic proportions and balloons into comical, colossal monumental proportions as watch time increases:
- 🛋️ **The Twitch Couch**: Expands from a living room sofa into a modular sectional, into an enormous royal stadium lounge sofa.
- 🖥️ **The Battlestation**: Scales from a simple wooden desk into a multi-curved ultrawide RGB rig with liquid cooling and illuminated mechanical keyboard.
- 📺 **The IMAX Home Cinema**: Scales from a flat monitor into an 85" OLED, into a curved theater display, into a massive wall-to-wall stadium screen.
- 🛏️ **The Imperial Bed**: Grows from a futon pad into a platform king bed, into a majestic four-poster royal canopy bed with plush pillows.
- 🧊 **The Streamer Refrigerator**: Scales from a drink cooler into a double French-door stainless smart fridge, into a commercial refrigeration monolith.
- 🏆 **The Trophy Showcase**: Expands from a wall shelf into a library archive holding gleaming Twitch partner trophies that catch 3D scene lighting.
- 💡 **The Stellar Chandelier**: Evolves from an incandescent cord bulb into an art-deco pendant, into a floating rotating gyroscopic celestial star-core.
- 🪴 **The Zen Mega-Bonsai**: Grows from a small succulent in a ceramic pot into a sprawling ancient indoor bonsai tree canopy.

Dynamic layout scaling automatically expands furniture placement outwards proportionally with house size so pieces fit comfortably inside the starter cabin and spread out as the rooms expand!

### 3. Interactive Features
- **OrbitControls**: Rotate, pan, and zoom around the 3D property.
- **Camera Presets**: Isometric View, Dollhouse Cutaway, Top-Down Floorplan, Interior Studio, and Cinematic Orbit Spin.
- **House View Modes**:
  - `Cutaway`: Removes front walls and roof so interior furniture growth is clearly visible.
  - `Exterior`: Shows complete architecture, facade, roof, and chimney.
  - `X-Ray`: Translucent holographic walls revealing both exterior structure and internal furniture simultaneously.
- **Dynamic Lighting**: Day (crisp sun), Sunset (golden hour amber), and Cyber Night (obsidian sky with glowing neon amethyst and screen RGB).
- **Celebration Fireworks & Synthesizer**: 3D particle confetti blasts, spring bounce animation on furniture, and synthesized Web Audio fanfares when a chatter levels up.
- **True Transparent OBS Overlay Mode**: Toggle via button or `?overlay=1` for a clean, truly transparent alpha background suitable for OBS browser sources.

---

## Scene and workspace controls

The 3D homes use procedural wood, stone, and roof textures, framed window openings, soft directional shadows, and studio reflections. The landscape grows with the property. Cutaway removes the roof and near-side walls; Exterior restores the full building; X-ray keeps the structure translucent. Daylight, Golden hour, and Night lighting blend smoothly.

- **Explore:** drag to orbit and scroll or pinch to zoom. Camera framing adapts to each viewer’s house tier and scale. Use the reset button to fit the home again after exploring.
- **Inspect:** open **Objects** or click furniture in the scene. The selected object is outlined. Choose **Focus in scene**, or press **F** while the canvas is focused, for a closer look.
- **Keyboard:** focus the canvas with Tab. Arrow keys orbit, **+ / −** zoom, **R** resets the camera, and **Escape** clears the object selection. Automatic orbit, growth animation, and celebrations respect reduced-motion preferences.
- **Growth:** watch-time multipliers remain visible in Objects. Furniture adapts to the room dimensions to keep all eight pieces visible as the architecture expands.
- **Smaller screens:** switch between **Community**, **3D home**, and **Activity & objects** using the workspace tabs. On desktop, expand the scene to hide the side panels.

The interface loads before the 3D engine. If WebGL is unavailable, the dashboard remains usable and offers a retry action. Scene resources are released when switching to and from OBS mode.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
cd twitch-watchtime-3d
npm install
```

### Running the Full Application
```bash
# 1. Build the production frontend assets:
npm run build

# 2. Launch the backend server (serves REST API, WebSockets, and frontend):
npm start
```
Open [http://localhost:3001](http://localhost:3001) in your browser!

### Running Tests
```bash
npm test
```
Runs 25 automated tests covering:
- Restoring original materials and glass transparency after X-ray and cutaway across all five 3D house tiers.
- Tier calculation boundary values (0s, 14m, 15m, 1h, 5h, 20h, negative values).
- Continuous house scaling math (`calculateHouseScale`).
- Monotonic furniture scaling calculations across all 8 furniture pieces and gigantism mode.
- Twitch IRC PRIVMSG tag and payload parsing, stripping IRC /me ACTION.
- Twitch IRC 353 RPL_NAMREPLY presence parsing for lurkers.
- Twitch IRC USERNOTICE subscription parsing.
- Activity window timeout mechanics (15-minute inactivity boundary).
- Channel switching isolation and safe multiplier clamping.
- REST API endpoints (`/api/status`, `/api/stream-status`, `/api/live-only`, `/api/multiplier`, `/api/gigantism`, `/api/chatters/:user/add-time`) and WebSocket INIT delivery.

---

## OBS Browser Source Setup
To add as a transparent overlay in OBS Studio or Streamlabs:
1. Add a **Browser Source** in OBS.
2. URL: `http://localhost:3001/?overlay=1&channel=your_channel`
3. Width: `1920`, Height: `1080`.
4. Check **Shutdown source when not visible**.
5. Enable browser source transparency (alpha channel is rendered directly by Three.js).

