# 🔍 Fuel Log AI — Project Review & Implementation Plan

**Reviewed:** 2026-04-26  
**Version:** 2.5.1  
**Stack:** Google Apps Script + Gemini 2.0 Flash  
**Status:** Approved for Implementation

---

## Overall Assessment

This is a **well-conceived, feature-rich** personal utility app with a strong design identity (Neo-Brutalist). The codebase is clean, lean, and ships real AI value (receipt OCR, live market prices). The modular split into `Styles.html` / `Scripts.html` / `Index.html` is solid.

This document details the agreed-upon technical approaches for resolving all identified bugs, code quality, and documentation issues. Any coding agent picking up this task should implement the solutions exactly as specified below.

---

## [x]🔴 Critical Bugs (Fix Before Next Deploy)

### BUG-01 — Double `</body></html>` Tags
**File:** `src/Index.html` — Lines 225–230  
After the `Scripts` include (line 224), there are **two** sets of closing `</body></html>` tags.
**Decision / Implementation:**
- Remove the second `</body></html>` pair (lines 227–230).
- Keep the `<?!= include('Scripts'); ?>` call at the bottom of the `<body>`. This defers execution until the DOM is parsed, which is the correct pattern.

### BUG-02 — `google_search` Tool + `response_schema` Incompatibility
**File:** `src/Code.gs` — Lines 163–187 (`getMarketData`)  
Gemini's grounding tools (`google_search`) and `response_schema` cannot be used together in the same request.
**Decision / Implementation (Two-Step API Call):**
- **Step 1:** Call Gemini with `google_search` tools to fetch live petrol/diesel prices (free text).
- **Step 2:** Pass that text into a second Gemini call using `response_schema` to format it into the expected JSON structure.
- **UX Update:** To account for the longer load time, update the frontend loading text in two phases (e.g., show `"Scanning live prices..."` before calling the backend).

### BUG-03 — `fuel_type` Is Collected But Never Saved
**File:** `src/Index.html` L91, `src/Code.gs` L36  
The `fuel_type` field is completely missing from the sheet schema and is silently dropped on save.
**Decision / Implementation:**
- Append `fuel_type` to the **end** of the `requiredHeaders` array in `initializeDatabase()`. Appending is safe non-destructive behavior for existing sheets with live data.
- Update the README database schema table to match.
- **AI Integration:** Update the `response_schema` and prompt in `processReceiptWithAI` so Gemini extracts `fuel_type` from the receipt image and auto-fills the dropdown with a yellow-ring highlight.

---

## 🟠 Important Issues (Fix Soon)

### BUG-04 — Efficiency Dot Logic Inconsistent With Stats Tab
**File:** `src/Scripts.html` — Lines 261–269 (`rend()`)  
The Logs tab efficiency dot ignores partial refills between full tanks, unlike the Stats tab which calculates it correctly.
**Decision / Implementation:**
- **Pre-compute:** Create a `calculateEfficiencies()` function that runs alongside `calculatePredictions()` after data loads.
- Populate a `state.efficiencies` map (keyed by log identifier). 
- `rend()` should just do a fast O(1) lookup against this state instead of calculating inline.

### BUG-05 — `getMarketData` Missing `muteHttpExceptions`
**File:** `src/Code.gs` — Line 190  
API 4xx/5xx responses throw uncaught exceptions that are silently swallowed.
**Decision / Implementation:**
- Add `"muteHttpExceptions": true` to the fetch payload.
- If `success: false`, return the specific error message from the API and display it in the frontend UI toast (e.g., `"Market API Error: 429 Rate Limit"`).

### BUG-06 — `+ New Vehicle` Is Session-Only
**File:** `src/Scripts.html` — `confirmVehicle()` (Lines 50–62)  
The inline "Add New Vehicle" flow adds the vehicle to the client-side dropdown only, resulting in data loss on reload if a log wasn't saved.
**Decision / Implementation:**
- **Store in Script Properties:** Create a backend function `addVehicle(name)` that stores the new vehicle in `PropertiesService.getScriptProperties()` as a JSON array.
- Update `getDataProtocol()` to read this property and merge it with the dynamically derived vehicle list from the log sheet.

### SEC-01 — Live `scriptId` Committed to Public Repo
**File:** `.clasp.json` — Line 2  
The live `scriptId` is exposed.
**Decision / Implementation:**
- Add `.clasp.json` to `.gitignore`.
- Create a template `.clasp.json.example` file with a placeholder `scriptId` and commit it.
- Update the README to tell users to copy this template during local setup.
- **Do not** rewrite Git history (low risk for this specific credential).

---

## 🟡 Code Quality & Architecture

### CODE-01 — Single-Letter Element IDs
Form fields use IDs `q`, `p`, `t`, `d`, `l`, `k`, `n` which damages readability.
**Decision / Implementation:**
- Perform a direct semantic rename: `k`→`km-reading`, `q`→`fuel-qty`, `p`→`fuel-price`, `n`→`notes`, `l`→`pump-location`, `d`→`refill-date`, `t`→`refill-total`.
- **Git workflow:** This should be done in an isolated, dedicated commit (`refactor: semantic element IDs`).

### CODE-02 — Hardcoded Vehicle Brand Colors
**File:** `src/Scripts.html` L146, `src/Styles.html` L104–114  
Radio button colors are mapped via string match (`kylaq`, `octavia`).
**Decision / Implementation:**
- Create a `state.buttonColors` array containing 4 button-safe background colors.
- Map vehicles dynamically by index (`btn-color-0`, `btn-color-1`, etc.).
- The chart palette (`state.colors`) remains completely separate.

### CODE-03 — Market Tab Fetches on Every Visit (No Cache)
**File:** `src/Scripts.html` — `setTab()` L72  
**Decision / Implementation:**
- Implement a frontend `sessionStorage` cache for the market response.
- Use a **4-hour TTL**. 
- The UI should check this cache before initiating the backend `getMarketData` call.

### CODE-04 — Stats Lifetime Average is Mathematically Imprecise
**File:** `src/Scripts.html` — Lines 305–308  
The lifetime average formula `max(km) - min(km) / total_fuel` is inflated because it doesn't account for the starting fuel state.
**Decision / Implementation:**
- Rewrite the lifetime average summary card to derive its value directly from the new unified `state.efficiencies` map (summing the correctly calculated intervals).

---

## [ ]📝 Documentation & Repository Polish

### DOC-01 — Broken Markdown Heading in README
**File:** `README.md` — Line 8  
**Decision:** Change `**# Fuel Log AI...` to `**Fuel Log AI...**` or a standard `##` header.

### DOC-02 — Duplicate Section 2 in PRD
**File:** `PRD.md`  
**Decision:** Fix the section numbering (there are two `## 2.` sections).

### DOC-03 — `package.json` Description Is Raw Markdown
**Decision:** Replace the raw markdown block in the description with plain text: `"AI-powered fuel receipt scanner and expense tracker built on Google Apps Script."`.

### DOC-04 — `appsscript.json` Defaults to Private Access
**File:** `src/appsscript.json` — Line 7  
**Decision:** Change `"access": "MYSELF"` to `"ANYONE"` so `clasp push` defaults match the README instructions for family sharing.

---

## 💡 Feature Suggestions (v2.6 Backlog)

*(Deferred for future updates)*
| ID | Idea | Rationale |
| :--- | :--- | :--- |
| FEAT-A | **Wire up `effTrend`** | Mission Report always shows `"STABLE"` — calculate actual % change vs previous full-tank log |
| FEAT-B | **CNG market price** | Market tab shows Petrol/Diesel only, but CNG is a supported fuel type |
| FEAT-D | **Delete log entry** | No way to remove erroneous entries from within the app |
| FEAT-E | **Export to CSV** | One-click download from the Logs tab for record-keeping or insurance purposes |
| FEAT-F | **`fuel_type` filter chips** | Quick All / Petrol / Diesel / CNG filter on the Logs tab |
| FEAT-G | **Year-based archiving** | As logs grow, a single sheet tab will hit GAS performance limits |

---
*Implementation Plan finalized by Antigravity AI & User | Fuel Log AI v2.5.1*
