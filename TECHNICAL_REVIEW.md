# Technical Review — Fuel Log AI

**Version Reviewed:** 2.7.0  
**Fixes Applied Through:** 2.9.0  
**Date:** 2026-06-07  
**Scope:** Project structure, documentation, backend, frontend, CSS/design, tooling

Legend: ✅ Fixed | 🚫 Not fixable (architectural constraint) | ⚠️ Accepted trade-off

---

## 1. Project Structure

| Issue | Severity | Status |
| :--- | :--- | :--- |
| `node_modules/` tracked by git | **Critical** | ✅ Fixed v2.7.0 — `git rm -r --cached` |
| `package.json` version was `1.0.0` | High | ✅ Fixed v2.8.0 — aligned to app version |
| Screenshots in repo root | Low | ✅ Fixed v2.9.0 — moved to `assets/` |
| Implementation History in PRD redundant with CHANGELOG | Low | ⚠️ PRD history kept for product context |

---

## 2. Backend — `Code.gs`

| Issue | Status |
| :--- | :--- |
| API key missing — silent failure | ✅ Fixed v2.8.0 — early guard returns clear error |
| Repeated hardcoded model URL | ✅ Fixed v2.8.0 — `GEMINI_URL` module constant |
| `getDataProtocol()` cryptic name | ✅ Fixed v2.8.0 — renamed `getFuelData()` |
| Dead `processAppSheetReceipt` stub | ✅ Fixed v2.8.0 — deleted |
| Inconsistent error response shape | ✅ Fixed v2.8.0 — all return `{ success, error }` |
| `lastPrice` by column index | ✅ Fixed v2.8.0 — resolved by header name |
| No backend input validation | ✅ Fixed v2.8.0 — numeric/boolean coercion in `saveEntryDirect` |
| `getMarketData` two API calls | 🚫 Gemini API constraint — `google_search` grounding and `response_mime_type: application/json` cannot be combined in one request; two-step is the correct implementation |
| `initializeDatabase()` on every call | ⚠️ Acceptable at current usage scale |

---

## 3. Frontend — `Scripts.html`

| Issue | Status |
| :--- | :--- |
| XSS via `innerHTML` injection | ✅ Fixed v2.7.0 + v2.8.0 — `esc()`, `safeUrl()`, `data-*` attributes |
| Cryptic function names | ✅ Fixed v2.8.0 — `syncData`, `renderLogs`, `submitEntry`, `calculateTotal`, `renderStats` |
| `confirmVehicle()` missing radio rebuild | ✅ Fixed v2.8.0 — `renderVehicleSelector()` shared helper |
| Efficiency key collision | ✅ Fixed v2.8.0 — existence guard before writing |
| Post-save sync race | ✅ Fixed v2.8.0 — reduced to 1 000 ms |
| `state.buttonColors` misleading array | ✅ Fixed v2.8.0 — replaced with `state.vehicleColorCount: 4` |
| Strict equality `!=` → `!==` | ✅ Fixed v2.8.0 |
| Silent `sessionStorage` errors | ✅ Fixed v2.8.0 — `console.warn` |
| Error toasts show actual message | ✅ Fixed v2.8.0 |
| ARIA on vehicle radios and filter pills | ✅ Fixed v2.9.0 — `role="radio"` + `aria-checked`, `aria-pressed`, keyboard `onkeydown` handler |
| `showMissionReport` efficiency duplication | 🚫 By design — HUD uses the just-submitted entry which is not yet in `state.logs`; can't read from `state.efficiencies` |

---

## 4. CSS / Design — `Styles.html`

| Issue | Status |
| :--- | :--- |
| Dead CSS classes | ✅ Fixed v2.8.0 — `.log-date`, `.log-vehicle`, `.log-cost`, `.log-details`, `table/th/td` removed |
| `transition: all` on body | ✅ Fixed v2.8.0 — scoped to `background-color, color` |
| Font sizes below WCAG minimum | ✅ Fixed v2.9.0 — `0.55rem` and `0.58rem` bumped to `0.65rem` throughout |
| Tailwind CDN `!important` conflicts | 🚫 CDN constraint — `@layer components` requires a build step; `!important` is the correct workaround with CDN |

---

## 5. Tooling / DX

| Gap | Status |
| :--- | :--- |
| `node_modules/` tracked by git | ✅ Fixed v2.7.0 |
| `package.json` version misaligned | ✅ Fixed v2.8.0 |
| `npm run lint` missed `.gs` files | ✅ Fixed v2.8.0 — target is now `eslint src/` |
| No `npm run deploy` / `push:force` | ✅ Fixed v2.8.0 |
| No pre-commit lint hook | ✅ Fixed v2.9.0 — husky v9 installed; `.husky/pre-commit` runs `npm run lint` |
| `.clasp.json.example` existence | ✅ Verified v2.9.0 — file exists with correct template |

---

## ARIA Coverage Added (v2.9.0)

| Element | Attributes added |
| :--- | :--- |
| `<nav>` | `role="tablist"` |
| Nav `<button>` ×4 | `role="tab"`, `aria-selected`, `aria-controls="tabN"` |
| Tab `<div>` panels ×4 | `role="tabpanel"`, `aria-labelledby="nav-tabN"` |
| Vehicle radio group `<div>` | `role="radiogroup"`, `aria-label="Select vehicle"` |
| Vehicle radio `<div>` items | `role="radio"`, `aria-checked`, `tabindex="0"`, `onkeydown` (Enter/Space) |
| Log filter `<button>` pills | `aria-pressed` |
| `setTab()` | Updates `aria-selected` on all nav buttons |
| `selectVehicle()` | Updates `aria-checked` on all radio items |
| `setLogFilter()` | Updates `aria-pressed` on all pills |

---

## All Items Resolved

All actionable review findings have been addressed through v2.9.0. The three items marked 🚫 are architectural constraints, not defects:

- **Two-API-call market data** — Gemini API does not allow combining `google_search` grounding with JSON structured output in one request.
- **`showMissionReport` efficiency duplication** — the HUD calculates efficiency for the just-submitted entry before it appears in `state.logs`; consolidation requires optimistic state management.
- **Tailwind CDN `!important`** — `@layer` is unavailable on the CDN build; requires a local Tailwind CLI build to resolve cleanly.
