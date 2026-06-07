# Technical Review — Fuel Log AI

**Version Reviewed:** 2.7.0  
**Date:** 2026-06-07  
**Scope:** Project structure, documentation, backend, frontend, CSS/design, tooling

---

## 1. Project Structure

| Issue | Severity |
| :--- | :--- |
| `node_modules/` is visible in the repo (not in `.gitignore`) | **Critical** |
| `package.json` version is `1.0.0` while app is at `2.7.0` | High |
| Screenshots (`ScreenShots.png`, `ScreenShots2.jpg`) dumped in root | Low |
| No `assets/` or `docs/` folder — root is cluttered | Low |
| Implementation History in `PRD.md` is now fully redundant with `CHANGELOG.md` | Low |

**Immediate action:** `.gitignore` is either missing or not covering `node_modules/`. If already tracked, run:
```bash
git rm -r --cached node_modules
echo "node_modules/" >> .gitignore
git add .gitignore && git commit -m "fix: remove node_modules from tracking"
```

---

## 2. Backend — `Code.gs`

### API key at module scope — no guard
```js
const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
```
If the key isn't set, every function silently receives `null` and the API URL becomes `...?key=null`. Add an early guard in each function that uses the key:
```js
if (!GEMINI_API_KEY) return { success: false, error: "GEMINI_API_KEY not configured in Script Properties." };
```

### Repeated hardcoded model URL — should be a constant
The full model URL string appears in two places (`processReceiptWithAI` and `getMarketData`). One model rename already required two edits. Extract it once:
```js
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
```

### `getMarketData` burns 2 API calls per request
The search → extract two-step round-trip is expensive. Gemini supports structured output with grounding enabled in a single call — this could collapse to one `UrlFetchApp.fetch`.

### Cryptic and dead function names
- `getDataProtocol()` → rename to `getFuelData()` or `getLogData()`
- `processAppSheetReceipt()` — dead stub that returns nothing; implement it or delete it

### Inconsistent error response shape
Some functions return `{ error: e.toString() }`, others return `{ message: e.toString() }`. The frontend checks both inconsistently. Standardize to one shape across all functions:
```js
return { success: false, error: e.toString() };
```

### `lastPrice` extracted by column index — fragile
```js
const lastPrice = rows[rows.length - 1][4]; // hardcoded column 4
```
If any column is ever inserted before column 4, this silently returns the wrong value. Look it up by header name like every other field in `saveEntryDirect`.

### No backend input validation
`saveEntryDirect` trusts all values from the frontend verbatim. At minimum, coerce numeric fields to numbers server-side before appending to the sheet.

---

## 3. Frontend — `Scripts.html`

### XSS via unsanitized `innerHTML` injection — **highest priority**
`rend()`, `stats()`, and `renderMarket()` inject backend data directly into `innerHTML`:
```js
// e.vehicle_name, e.pump_location, s.url, s.title — all unescaped
html += `<div>${e.vehicle_name}</div>`;
```
If Gemini returns `<img src=x onerror=alert(1)>` in any extracted field, it executes. Add a small escape helper and use it everywhere data is injected:
```js
const esc = s => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
```
Also: `renderMarket()` puts `s.url` directly into `href` — a `javascript:` URL in a grounded source would execute on click. Validate URLs before rendering.

### All core function names are cryptic abbreviations
These names make the codebase genuinely hard to search and debug:

| Current | Should be |
| :--- | :--- |
| `ref()` | `syncData()` |
| `rend()` | `renderLogs()` |
| `sub(e)` | `submitEntry(e)` |
| `calc()` | `calculateTotal()` |
| `stats()` | `renderStats()` |

### Duplicated efficiency calculation logic
`calculateEfficiencies()` and `showMissionReport()` both implement the same partial-tank accumulation loop independently (~20 lines each). `showMissionReport` should read from the already-computed `state.efficiencies`, not recompute from scratch.

### `state.efficiencies` key can silently collide
Key is `${dateKey}_${vehicleName}`. Two full-tank refills on the same day for the same vehicle silently overwrite each other. Use a unique row identifier or append an index.

### `setTimeout(ref, 3000)` after save is a race condition
3 seconds is a guess at how long the sheet append takes. If it takes longer, `ref()` returns stale data. Better options: optimistically update `state.logs` locally, or have `saveEntryDirect` return the saved row.

### `confirmVehicle()` doesn't rebuild radio buttons
Adding a new vehicle updates the dropdown but the radio group (shown for ≤4 vehicles) is only rebuilt by `ref()`. The new vehicle won't appear as a radio button until the next full data sync.

### Comment/code mismatch in `processImage`
```js
const max = 1200; // Increased resolution for better AI extraction
```
PRD and README both state 800px. Either update the docs to say 1200px, or revert the code and remove the comment.

### Mixed equality operators
`kInput.value != "0"` uses loose equality (`!=`). The rest of the codebase uses `===` / `!==`. Standardize to strict equality throughout.

---

## 4. CSS / Design — `Styles.html`

### Dead CSS classes
`.log-date`, `.log-vehicle`, `.log-cost`, `.log-details` are defined in `Styles.html` but log cards are rendered entirely with inline Tailwind classes in `rend()`. These custom classes are never applied and should be removed.

### Tailwind CDN + custom CSS creates specificity conflicts
The `!important` flags throughout `.neo-input` are a direct symptom of Tailwind utility classes overriding custom styles. Options:
- Drop Tailwind on form elements and own all styles in `Styles.html`
- Or define neo-* components inside a Tailwind `@layer components` block

### `transition: all` on `body` is a performance anti-pattern
```css
body { transition: all 0.3s ease; }
```
`transition: all` triggers style recalculation on every property change including layout. Replace with:
```css
body { transition: background-color 0.3s ease, color 0.3s ease; }
```

### Vehicle colors defined in two places — can drift
`state.buttonColors` array in `Scripts.html` and `.btn-color-0..3` in `Styles.html` are parallel definitions. If one is updated without the other, colors displayed won't match what the JS expects. CSS custom properties would unify them:
```css
.vehicle-radio { background-color: var(--btn-color); }
```
```js
el.style.setProperty('--btn-color', state.buttonColors[i]);
```

### Font sizes below WCAG minimum
`0.55rem` (~8.8px) and `0.58rem` (~9.3px) appear on log card metadata and month separators. WCAG 2.1 SC 1.4.4 recommends a minimum of 12px for readable text. These are secondary labels, but worth a bump to `0.65rem` minimum.

### No ARIA on interactive elements
- Tab buttons have no `role="tab"`, `aria-selected`, or `aria-controls`
- Vehicle radio `<div onclick>` elements are not `<button>` — keyboard users can't activate them
- Filter pills have no `aria-pressed`
- Screen readers receive none of the navigation semantics

---

## 5. Tooling / DX

| Gap | Recommended Fix |
| :--- | :--- |
| `node_modules/` likely tracked by git | Add to `.gitignore`, run `git rm -r --cached node_modules` |
| `package.json` version stuck at `1.0.0` | Bump to `2.7.0` to match app version |
| `npm run lint` targets `src/**` — `.gs` files are not `.js` | Change target to `eslint src/` or add `--ext .gs,.js` |
| No `npm run deploy` script | Add `"deploy": "clasp push --force && clasp deploy"` |
| No pre-commit lint hook | Add a `pre-commit` git hook or use `husky` |
| `.clasp.json.example` referenced in README — verify it exists | Create it if missing |

---

## Priority Order

| # | Item | File | Why |
| :--- | :--- | :--- | :--- |
| 1 | `node_modules/` in git | `.gitignore` | Repo bloat, credential exposure risk |
| 2 | XSS via `innerHTML` injection | `Scripts.html` | Security |
| 3 | Missing API key guard | `Code.gs` | Silent failures in production |
| 4 | Extract `GEMINI_URL` constant | `Code.gs` | Next model migration will require one edit, not two |
| 5 | Rename cryptic functions | `Scripts.html` | Maintainability |
| 6 | Standardize error response shape | `Code.gs` | Backend/frontend contract reliability |
| 7 | Dead CSS cleanup | `Styles.html` | File size and reader confusion |
| 8 | Efficiency logic deduplication | `Scripts.html` | Single source of truth for core calculation |
| 9 | `transition: all` on body | `Styles.html` | Rendering performance |
| 10 | ARIA and accessibility | `Index.html` / `Styles.html` | Long tail, but real users affected |
