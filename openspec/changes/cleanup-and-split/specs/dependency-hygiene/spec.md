## ADDED Requirements

### Requirement: Declared dependencies must be imported

Every entry under `dependencies` in `package.json` SHALL have at least one `import` or `require` statement somewhere under `src/`, `server.ts`, or `vite.config.ts`. Entries without imports SHALL be removed.

#### Scenario: pixi packages removed if unused
- **WHEN** `npm ls @pixi/react pixi.js pixi-filters` is run after the change
- **THEN** these packages MUST NOT be listed (they MUST be removed from `package.json`) UNLESS at least one source file imports them

#### Scenario: gemini SDK removed if unused
- **WHEN** `npm ls @google/genai` is run after the change
- **THEN** the package MUST NOT be listed UNLESS at least one source file imports it

#### Scenario: dependency audit grep
- **WHEN** searching the source for an import of each entry in `package.json` `dependencies`
- **THEN** each entry MUST yield at least one match OR have a justification comment near its sole usage point

### Requirement: Documentation matches runtime behavior

The `README.md` SHALL describe only behavior that the running code actually performs. Claims about external API integrations SHALL be qualified with the current implementation status.

#### Scenario: README describes encounter endpoint accurately
- **WHEN** `README.md` is read
- **THEN** it MUST state that `/api/encounter` currently returns locally pre-configured data (not Gemini-generated) until the real integration is implemented

#### Scenario: README does not promise unimplemented features
- **WHEN** `README.md` is read
- **THEN** it MUST NOT claim Gemini API integration as a delivered feature without qualification

### Requirement: AI Studio metadata flag is preserved with disclosure

The file `metadata.json` SHALL retain any flags required by the AI Studio runtime platform, even if the corresponding feature is not yet implemented in source. A code comment or accompanying note SHALL document that the flag is forward-declaring intent rather than reflecting current code.

#### Scenario: metadata.json unchanged in capability flags
- **WHEN** `metadata.json` is read after the change
- **THEN** the `majorCapabilities` array MUST be unchanged from the pre-change state unless explicitly approved (see Open Question Q1 in design.md)

#### Scenario: forward-declaration disclosure exists
- **WHEN** the change is merged
- **THEN** either `README.md` OR `AGENT.md` MUST contain a note acknowledging that `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` is declared for platform routing but the actual Gemini call is not yet implemented

### Requirement: Server endpoint accurately self-documents

The handler at `/api/encounter` in `server.ts` SHALL have comments that describe its current implementation truthfully (returns pre-configured data) and indicate where a real Gemini call would be inserted later.

#### Scenario: endpoint comment is accurate
- **WHEN** `server.ts` `/api/encounter` handler is read
- **THEN** its leading comment MUST NOT describe behavior the handler does not perform; if the handler returns local data only, the comment MUST say so
