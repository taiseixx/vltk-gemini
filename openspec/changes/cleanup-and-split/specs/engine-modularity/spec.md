## ADDED Requirements

### Requirement: Three-layer module separation

The codebase SHALL organize game engine code into exactly three layers: `components/` (React glue), `game/` (pure TypeScript domain logic), and `render/` (Canvas2D drawing helpers). Each layer SHALL only depend on layers below it.

#### Scenario: render layer is React-free
- **WHEN** any file under `src/render/` is examined
- **THEN** it MUST NOT contain imports from `react`, `react-dom`, or any file under `src/game/`

#### Scenario: game layer is render-free
- **WHEN** any file under `src/game/` is examined
- **THEN** it MUST NOT contain imports from `react`, `react-dom`, files under `src/render/`, or direct Canvas2D API references (no `CanvasRenderingContext2D`, `HTMLCanvasElement`, `getContext`)

#### Scenario: components layer is the only React surface
- **WHEN** any file outside `src/components/` is examined
- **THEN** it MUST NOT import from `react` or `react-dom`

### Requirement: GameCanvas component size budget

The file `src/components/GameCanvas.tsx` SHALL contain only React glue code (canvas ref, requestAnimationFrame loop scaffolding, pointer/keyboard handlers, lifecycle effects) and SHALL NOT exceed 400 lines of code.

#### Scenario: line count budget
- **WHEN** `wc -l src/components/GameCanvas.tsx` is run after refactor
- **THEN** the count MUST be ≤ 400

#### Scenario: no business logic in GameCanvas
- **WHEN** `GameCanvas.tsx` is examined
- **THEN** it MUST NOT contain inline mob spawning formulas, sect lookup tables, image pixel manipulation code, character drawing primitives, or skill cooldown calculations — these MUST be imported from `game/` or `render/`

### Requirement: Game systems share consistent tick signature

Every file under `src/game/systems/` SHALL export a primary tick function whose signature is `(state, dt, refs) => void` or a documented compatible variant.

#### Scenario: tick signature consistency
- **WHEN** any system file under `src/game/systems/` is examined
- **THEN** it MUST export at least one function that takes the current game state and a delta-time (seconds) as parameters and returns `void`

### Requirement: Render passes preserve original draw order

The refactor SHALL preserve the original z-ordering of canvas draw passes (terrain → scenery → drops → entities → player → particles → floating texts → UI overlays).

#### Scenario: draw order parity
- **WHEN** comparing render output of pre-refactor vs post-refactor with the same RNG seed
- **THEN** the visual output for the first 5 stages MUST be pixel-equivalent (manual screenshot diff)

### Requirement: Cocos pseudo-engine is removed

The file `src/lib/cocos/index.ts` SHALL be deleted, and no file in the codebase SHALL import from `../lib/cocos` or `@/lib/cocos`.

#### Scenario: cocos directory absent
- **WHEN** the repository is searched
- **THEN** the path `src/lib/cocos/` MUST NOT exist

#### Scenario: no residual cc references
- **WHEN** the source is grep'd for `cc.Node`, `cc.director`, `cc.Label`, `cc.sequence`, `cc.moveTo`, `cc.fadeTo`, `cc.callFunc`, `cc.ParticleSystem`
- **THEN** zero matches MUST be returned

### Requirement: Damage-label visuals preserved without cocos

The damage-label fade animation (previously implemented using `cc.Label` + `cc.sequence(cc.moveTo, cc.callFunc) + cc.fadeTo`) SHALL be reimplemented using the existing `textsRef` floating-text system with equivalent fade-up duration and opacity curve.

#### Scenario: damage labels still appear
- **WHEN** the player deals damage to a mob in stage 1
- **THEN** a floating damage number MUST appear above the mob, drift upward, and fade out within ~0.6-0.8 seconds

#### Scenario: rage-mode label sizing preserved
- **WHEN** rage mode is active and damage is dealt
- **THEN** the floating damage number MUST be visibly larger than the non-rage equivalent (parity with prior `pRef.rageActive ? 17 : 13` font size)
