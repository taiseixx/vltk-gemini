# Võ Lâm Tà Kiếm Gemini (vltk-gemini)

Wuxia canvas-based action game written in React + TypeScript.

## Status disclaimer (post cleanup-and-split refactor)

- **AI / Gemini integration: NOT YET WIRED.** The endpoint `/api/encounter`
  currently returns locally pre-configured encounter data from
  `server.ts` (see `getLocalEncounters`). The "Gemini server-proxy"
  capability advertised in `metadata.json` is forward-declared, not
  active.
- **Bundle**: `@google/genai`, `pixi.js`, `@pixi/react`, `pixi-filters`
  removed in this refactor (all were declared but never imported).
- **Architecture**: source split into three layers under `src/`:
  - `components/` — React glue
  - `render/` — Canvas2D drawing (imageProcessing, imageCache,
    spriteLoader, character, world)
  - `game/` — pure TS game logic (elements, spawn) + per-tick
    systems (`game/systems/` — companion, movement, drops, effects)

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. (Optional, for future Gemini integration) Set the `GEMINI_API_KEY`
   in `.env.local` — currently unused.
3. Run the app:
   `npm run dev`
