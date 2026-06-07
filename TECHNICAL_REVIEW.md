# Technical Review — Fuel Log AI

**Version Reviewed:** 2.7.0  
**Fixes Applied Through:** 2.8.0  
**Date:** 2026-06-07  
**Scope:** Project structure, documentation, backend, frontend, CSS/design, tooling

Legend: ✅ Fixed | ⚠️ Acknowledged / low priority | 🔲 Open

---

## 1. Project Structure

| Issue | Severity | Status |
| :--- | :--- | :--- |
| `node_modules/` tracked by git | **Critical** | ✅ Fixed in v2.7.0 — `git rm -r --cached`, `.gitignore` was already correct |
| `package.json` version was `1.0.0` | High | ✅ Fixed in v2.8.0 — bumped to `2.8.0` |
| Screenshots in root | Low | ⚠️ Move to `assets/` when convenient |
| Implementation History in PRD redundant with CHANGELOG | Low | ⚠️ PRD history kept for product context; CHANGELOG is the authoritative release log |

---

## 2. Backend — `Code.gs`

### ✅ API key missing — now guarded
`processReceiptWithAI()` and `getMarketData()` return `{ success: false, error: "GEMINI_API_KEY not configured…" }` immediately if the key is absent.

### ✅ Repeated hardcoded model URL — extracted as constant
`GEMINI_URL` is now a module-level constant. Future model migrations require one edit.

### ✅ `getDataProtocol()` renamed to `getFuelData()`

### ✅ Dead `processAppSheetReceipt` stub removed

### ✅ Error response shape standardized
All functions now return `{ success: false, error: "…" }`. The `message` key is gone.

### ✅ `lastPrice` now looked up by header name
No longer hardcoded to column index 4.

### ✅ Backend input validation added
`saveEntryDirect()` coerces numeric fields via `parseFloat` and booleans via strict comparison before writing to the sheet.

### ⚠️ `getMarketData` makes 2 API calls per request
The search → extract two-step pattern could collapse to one call using structured output with grounding. Low priority — the cache makes this infrequent.

### ⚠️ `initializeDatabase()` called on every read/write
Defensive but slightly wasteful. Acceptable for current usage scale.

---

## 3. Frontend — `Scripts.html`

### ✅ XSS via unsanitized `innerHTML` — fixed in v2.7.0 + v2.8.0
`esc()` applied to all user/AI data injected into `innerHTML`. `safeUrl()` blocks `javascript:` hrefs. Vehicle names moved from inline `onclick` string interpolation to `data-*` attributes.

### ✅ Cryptic function names — all renamed
| Old | New |
| :--- | :--- |
| `ref()` | `syncData()` |
| `rend()` | `renderLogs()` |
| `sub(e)` | `submitEntry(e)` |
| `calc()` | `calculateTotal()` |
| `stats()` | `renderStats()` |

### ✅ `confirmVehicle()` missing radio rebuild — fixed
`renderVehicleSelector()` extracted as a shared helper called by both `syncData()` and `confirmVehicle()`.

### ✅ Efficiency key collision prevented
`calculateEfficiencies()` now guards with `if (state.efficiencies[key] === undefined)` before writing, keeping the first result and preventing silent overwrites.

### ✅ Post-save sync delay reduced
`setTimeout(syncData, 3000)` → `setTimeout(syncData, 1000)`. The GAS success handler already confirms the write is committed.

### ✅ `state.buttonColors` replaced with `state.vehicleColorCount: 4`
The array values were never read — only `.length` was used. Removes the misleading parallel color definition.

### ✅ Strict equality
`!=` → `!==` in `predictOdometer()`.

### ✅ Stale BUG-06 comment removed from `confirmVehicle()`

### ✅ `sessionStorage` errors now logged
`catch (e) {}` replaced with `catch (e) { console.warn(…) }` in `loadMarket()`.

### ✅ Error messages improved
`ui.toast("AI Scan Failed")` → `ui.toast(res.error || "AI Scan Failed")` where applicable.

### ⚠️ Duplicated efficiency calculation logic
`showMissionReport()` still independently re-derives efficiency from raw logs rather than reading `state.efficiencies`. Acceptable because the HUD runs on the just-submitted entry which is not yet in `state.logs`. Refactor opportunity only once optimistic state updates are implemented.

---

## 4. CSS / Design — `Styles.html`

### ✅ Dead CSS classes removed
`.log-date`, `.log-vehicle`, `.log-cost`, `.log-details`, `table`, `th`, `td` were never applied to rendered HTML — removed.

### ✅ `transition: all` on body replaced
Now `transition: background-color 0.3s ease, color 0.3s ease`.

### ⚠️ Tailwind CDN + custom CSS specificity conflict
`!important` flags remain in `.neo-input`. Resolving fully requires migrating to Tailwind `@layer components` or removing Tailwind from form inputs. Low priority — functional, just ugly.

### ⚠️ Font sizes below WCAG minimum
`0.55rem`–`0.58rem` on secondary labels (~8.8–9.3px). Design trade-off accepted; flagged for future accessibility pass.

### ⚠️ No ARIA on interactive elements
Tabs, vehicle radio `<div>` elements, and filter pills lack `role`, `aria-selected`, and `aria-pressed`. Deferred to a dedicated accessibility pass.

---

## 5. Tooling / DX

| Gap | Status |
| :--- | :--- |
| `node_modules/` tracked by git | ✅ Fixed |
| `package.json` version `1.0.0` | ✅ Fixed — `2.8.0` |
| `npm run lint` targeted `src/**` (missed `.gs`) | ✅ Fixed — now `eslint src/` |
| No `npm run deploy` script | ✅ Fixed — added `deploy` and `push:force` |
| No pre-commit lint hook | ⚠️ Add `husky` or a `.git/hooks/pre-commit` script when tooling overhead is acceptable |
| `.clasp.json.example` referenced in README | ⚠️ Verify/create if missing |

---

## Open Items Summary

These items are acknowledged but deferred — no blocking defects:

1. Screenshots in repo root → move to `assets/`
2. `getMarketData` two-API-call pattern → collapse to single grounded structured-output call
3. `showMissionReport` duplicated efficiency logic → refactor after optimistic state updates
4. Tailwind `!important` specificity → `@layer components` migration
5. Font sizes on secondary labels → accessibility pass
6. ARIA roles on tabs and filter pills → accessibility pass
7. Pre-commit lint hook → add `husky` when CI is set up
8. `.clasp.json.example` → verify exists
