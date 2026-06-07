# Product Requirement Document (PRD): Fuel Log AI

**Version:** 2.8.0 (Code Quality & Security Hardening)  
**Status:** Active  
**Date:** 2026-06-07  
**Author:** Product Management Team (AI)

---

## 1. Executive Summary
**Fuel Log AI** v2.7.0 upgrades the AI backend from the deprecated `gemini-2.0-flash` model to `gemini-3.1-flash-lite`, restoring receipt scanning and market price grounding functionality. v2.6.0 delivered a comprehensive code quality overhaul and a redesigned Add tab UX, resolving all items from the v2.5.1 code review (CODE-01 through CODE-04) and shipping six UX improvements to the primary data-entry flow.

## 2. New Features in v2.6.0
- **Fuel Type Chips**: Petrol / Diesel / CNG replaced the dropdown with segmented tap-buttons; AI scanner updates chip state with yellow highlight.
- **Odometer Toggle**: Full Tank moved to an inline `✓ Full / Partial` pill beside the Odometer label, making the odometer input full-width.
- **Quantity Emphasis**: Empty Qty field shows a dashed yellow border to direct first-entry attention; resets on input and after save.
- **GPS Button Fix**: Station Location input and GPS pin button are now proper flex siblings — no more text clipping.
- **Scan Menu**: Two header scanner buttons merged into a single 📷 dropdown (Camera / Gallery); closes on outside tap.
- **Notes Collapse**: Notes textarea defaults to 1 row, expands to 4 on focus, collapses again if empty.
- **Dynamic Vehicle Colors**: Vehicle radio buttons now use index-based CSS classes (`btn-color-0..3`) instead of hardcoded brand names.
- **Market Cache**: `sessionStorage` cache (4-hour TTL) prevents redundant `getMarketData` calls on repeat Market tab visits.
- **Precise Lifetime Average**: Stats card efficiency derived from the mean of correctly-calculated interval efficiencies (not inflated `max_km − min_km / total_fuel`).
- **Semantic Element IDs**: All single-letter form IDs renamed (`k`→`km-reading`, `q`→`fuel-qty`, `p`→`fuel-price`, `n`→`notes`, `l`→`pump-location`, `d`→`refill-date`, `t`→`refill-total`).

## 3. Product Objectives
- **Minimize User Effort:** Reduce manual data entry by 80% using AI-powered receipt scanning.
- **Accuracy:** Ensure precise tracking of mileage (KM readings), fuel quantity, and costs.
- **Insight:** Provide users with contextual data (local market prices) to inform purchasing decisions.
- **Accessibility:** Deliver a seamless experience across mobile devices via a responsive web interface.

## 4. User Personas
1.  **The Daily Commuter:** Wants to quickly log a refill at the pump without fumbling with numbers.
2.  **The Fleet Driver:** Needs to report accurate expense data to managers with proof (receipts) and location data.
3.  **The Cost-Conscious Owner:** Tracks fuel efficiency and compares pump prices to market averages.

## 5. Feature Scope (MoSCoW)

### Must Have (P0)
-   **AI Receipt Scanning:**
    -   User captures/uploads a receipt image.
    -   **Dual-Trigger Input:** Specific buttons for direct Camera access (`📷`) vs. File explorer (`📁`).
    -   Frontend compresses image to max 800px and JPEG quality 0.7 before sending to backend.
    -   System extracts: `Fuel Quantity`, `Fuel Price`, `Total Amount`, `Date`, and granular location data (`Vendor`, `City`, `Area`).
    -   Backend Model: Gemini 3.1 Flash-Lite (`gemini-3.1-flash-lite`).
    -   **GPS-Appended Notes:** After AI extraction, the frontend attempts to fetch GPS coordinates and appends them to the `Notes` field (e.g., `"Shell - Whitefield, Bangalore | GPS: 12.9716, 77.5946"`). Falls back gracefully if GPS is unavailable.
    -   **AI Success Highlight:** AI-populated fields receive a yellow ring highlight (`ring-yellow-400`) for 3 seconds.

-   **Manual Entry & Validation:**
    -   User can edit AI-extracted values or enter data manually if no receipt is available.
    -   Mandatory fields: `Vehicle Name`, `KM Reading`, `Fuel Quantity`, `Price / L`.
    -   Optional fields: `Pump Location`, `Notes` (AI result or free text), `Full Tank` (checkbox, checked by default).
    -   Fuel types supported: **Petrol**, **Diesel**, **CNG**.

-   **Data Persistence:**
    -   Save all records to a Google Sheet (`Log` tab).
    -   **Auto-Initialization Engine:** `initializeDatabase()` is called before every read/write operation to ensure sheet integrity.
    -   **Manual Control Menu:** Custom Spreadsheet UI menu (`Fuel Log AI > Initialize Database`) for manual setup.

-   **Vehicle Management:**
    -   Support multiple vehicles via a dropdown or radio-button selector.
    -   **Smart Vehicle Selector:** Automatically switches from a Dropdown to large Radio Buttons when the vehicle count is between 1 and 4 (inclusive). Reverts to dropdown for 5+ vehicles. Dynamic index-based accent colors applied (`btn-color-0..3`).
    -   **Add New Vehicle:** Inline `+ New` prompt to add a vehicle name on the fly; persisted to Script Properties for zero data loss on reload.

-   **Historical Log View:**
    -   Chronological card list of the last **50** refills (Date, Vehicle, Amount, Fuel Qty, Price/L).
    -   Visual **Efficiency Dot** (Green ≥15 KM/L, Yellow ≥10 KM/L, Red <10 KM/L) shown on full-tank log cards.
    -   Partial vs. Full tank visual label (green "Full" / orange "Partial").
    -   Truncated `Notes` preview inline on each card.

### Should Have (P1)
-   **Market Price Insights:**
    -   Fetch current Petrol/Diesel prices for the user's current city using GPS.
    -   Compare user's paid price vs. market average with an AI-generated insight summary.
    -   Display source links for market data.
    -   Backend: Gemini 3.1 Flash-Lite + Google Maps Reverse Geocoding + Google Search tool.

-   **Mobile Optimization:**
    -   Viewport configuration for proper scaling (`user-scalable=no`, `viewport-fit=cover`).
    -   `100svh` height for correct mobile browser chrome handling.
    -   `16px` minimum font size on all inputs to prevent iOS auto-zoom.
    -   `inputmode="decimal"` on numeric fields to trigger the correct mobile keypad.

-   **Mission Report HUD:**
    -   Post-log bottom-sheet overlay with Efficiency Grade (S/A/B/C), KM/L value, and % Trend vs. previous refill.
    -   Grade thresholds: S > 22 KM/L, A > 18, B > 15, C < 15.
    -   Auto-dismisses after 6 seconds. Tap to dismiss early.

-   **Dark Mode:**
    -   Manual toggle button (🌓) in the header, persisted via `localStorage`.
    -   A full CSS variable theming system controls all colors for both `light` and `dark` states.
    -   Calendar picker icons are inverted in dark mode via `filter: invert()`.

-   **AppSheet Integration Hook:**
    -   Backend stub `processAppSheetReceipt(rowId)` in `Code.gs` to allow automation via AppSheet or other external triggers.
    -   **Note:** The stub references the sheet name `"Logs"` while the live sheet is named `"Log"` — this must be aligned before activation.

### Could Have (P2)
-   **Stats & Analytics Tab:**
    -   Per-vehicle summary card showing lifetime average efficiency (KM/L).
    -   Interactive `Chart.js` line chart showing KM/L efficiency trend over time (full-tank refills only).
    -   Chart tooltip shows refill cost on hover/tap.
-   **Station Autocomplete:** `<datalist>` pre-populates the Pump Location field with previously used station names.

---

## 6. Functional Requirements

### 6.1 Receipt Processing (AI)
| ID | Requirement Description | Technical Implementation Reference |
| :--- | :--- | :--- |
| **FR-01** | System must accept image uploads (JPEG/PNG), compress to max 800px / 0.7 JPEG quality, and convert to Base64. | Frontend `FileReader` + `Canvas` resize |
| **FR-02** | System must send Base64 image to Gemini 3.1 Flash-Lite for granular entity extraction (Vendor, City, Area, Qty, Price, Date). | `processReceiptWithAI(base64Image)` |
| **FR-03** | System must consolidate extracted location data (Vendor, Area, City) into the `Notes` field and pre-fill the form. | `processReceiptWithAI` backend logic |
| **FR-04** | Frontend must attempt GPS acquisition post-scan and append coordinates to Notes (format: `| GPS: lat, lon`). | `processImage()` → `navigator.geolocation` |

### 6.2 Data Management
| ID | Requirement Description | Technical Implementation Reference |
| :--- | :--- | :--- |
| **FR-05** | System shall ensure the `Log` sheet exists and contains required headers on first run or manual trigger. | `initializeDatabase()` |
| **FR-06** | Entries must handle specific data types: String (Vehicle, Location), Float (Price/Qty), Date (Refill Date), Boolean (Full Tank), String (Notes). | `saveEntryDirect(entry)` |
| **FR-07** | System must retrieve historical data in **reverse chronological order** and expose unique vehicle list and last fuel price. | `getDataProtocol()` |
| **FR-08** | Log view must display at most 50 entries. | `state.logs.slice(0, 50)` in `rend()` |

### 6.3 Location & Market Data
| ID | Requirement Description | Technical Implementation Reference |
| :--- | :--- | :--- |
| **FR-09** | System obtains user's Lat/Lon (with permission) to fetch market data. | Geolocation API in `loadMarket()` |
| **FR-10** | System resolves Lat/Lon to a "Locality" city name. | `Maps.newGeocoder()` in `getMarketData()` |
| **FR-11** | System queries Gemini for current market rates in that city using Google Search grounding. | `getMarketData()` with `google_search` tool |
| **FR-12** | GPS button on the entry form sets the Pump Location field to raw coordinates. | `fetchGPS()` → `#pump-location` |

---

## 7. User Interface (UI) Requirements

The application's UI follows a **Neo-Brutalist** design philosophy: high-contrast elements, thick solid borders, hard drop-shadows, and heavy uppercase `Inter` typography.

### Design System Classes
| Class | Purpose |
| :--- | :--- |
| `.neo-card` | White/dark card with 2px border and 3px hard shadow (Primary: `#FFDE03`) |
| `.neo-btn` | Cyber Yellow primary button with uppercase bold text and press animation |
| `.neo-btn-secondary` | Card-background colored secondary variant |
| `.neo-input` | Styled input with 2px borders, 8px radius, and mechanical focus shift |

### Layout Structure
1.  **Header:** App title + theme toggle + single 📷 Scan button (expands to Camera / Gallery sub-menu; closes on outside tap).
2.  **Main Area:** 4-tab content panel, scrollable, height = `100svh - 160px`.
3.  **Bottom Nav:** Fixed 4-column bar with SVG icons and labels (Add, Logs, Stats, Market). Active tab highlighted with primary yellow (`nav-active`). Tab switch triggers a `fadeIn` animation.

### Tab Details
- **Add Tab:** Form grouped into 3 visual blocks — a) Vehicle radio + Fuel Type chips grid, b) Full-width Odometer with inline `✓ Full / Partial` toggle + Fuel math row (Qty × Price = Total), c) Date/Location row. Qty field has dashed yellow emphasis when empty. Notes collapses to 1 row by default.
- **Logs Tab:** Scrollable card list. Each card shows date, vehicle+efficiency dot, fuel qty badge, full/partial label, notes snippet, cost, and price/L.
- **Stats Tab:** Per-vehicle summary cards + Chart.js line chart.
- **Market Tab:** City header, AI insight, Petrol/Diesel price cards, and source links.

---

## 8. Technical Constraints & Architecture
- **Platform:** Google Apps Script Web App (`doGet`).
- **Structure:** Core logic and UI moved to `/src` directory for better project organization and `clasp` compatibility.
- **Development Tooling:** **Google Clasp** is the recommended tool for local development and CI/CD.
  - **Source Root:** All operational code is stored in the `src/` directory.
  - **Benefits:** Git integration, local IDE support, automated deployments, and structured directory support.
  - **Sync Logic:** `clasp push` (or `clasp push --force` if push is skipped) uploads files from `src/` to the GAS project; `clasp pull` synchronizes remote changes.
  - **Deployment:** `clasp deploy --description "vX.Y.Z — notes"` creates a new numbered deployment version. Use `clasp deployments` to list active deployments and `clasp undeploy <id>` to remove stale ones. Always push before deploying.
- **Frontend:** Single-file `src/Index.html` using Tailwind CSS (CDN) + Chart.js (CDN) + Inter font (Google Fonts).
-   **AI Engine:** Google Gemini 3.1 Flash-Lite (`gemini-3.1-flash-lite`).
-   **Zero-Cost Hosting:** Self-hosted within the user's Google Workspace/Drive account.
-   **Templating:** Server-side HTML template (`HtmlService.createTemplateFromFile`).
-   **State Management:** Centralized `state` object on the frontend holding `logs`, `vehicles`, `lastPrice`, `chart`, `colors`, `buttonColors`, `predictions`, `efficiencies`, `logFilter`, `logVisible`, and `chartPeriod`.
-   **Security:** Gemini API Key managed via `PropertiesService.getScriptProperties()`.
-   **Quotas:** Subject to Google Apps Script quotas for `UrlFetchApp` calls and script runtime limits.

---

## 9. Success Metrics
-   **Task Completion Time:** < 30 seconds to log a fuel stop.
-   **AI Accuracy:** > 90% correct extraction of Total Amount and Date from clear receipt images.

---

## 10. Implementation History

### 🛡️ v1.0 – Resilience & Error Handling
- Global error management for all `google.script.run` calls.
- Fail-safe loading overlay dismissal on backend errors.
- API key moved to `PropertiesService`.

### 📱 v1.1 – Mobile & Gamification
- `100svh` support; 16px anti-zoom inputs.
- Mission Report HUD with Efficiency Grade (S–C).
- Dual-Trigger scanner (📸 Cam vs. 📁 File).

### ✨ v1.2 – Neo-Brutalism Theme
- Full UI redesign: high-contrast, thick borders, hard shadows, uppercase Inter.
- Compact vehicle header, Math Row layout, floating Total Cost card.
- Mechanical input focus states.

### 🚀 v2.0 – Dark Mode & Smart UX
- Dark Mode with `localStorage` persistence and CSS variable theming.
- Toast notification system replacing native `alert()`.
- Price Memory (auto-fills last fuel price).
- `inputmode="decimal"` for all numeric fields.

### 💎 v2.1 – Polish & Advanced Interaction
- Card-based Log View replacing mobile-unfriendly table.
- Live Efficiency Gauge dots on log cards (Green/Yellow/Red).
- Smart Vehicle Selector (Radio Buttons ≤4 vehicles / Dropdown ≥5).
- Tab switch fade-in animation + SVG nav icons.
- Silent GPS prefetch on app load.

### 🛠️ v2.2 – Initialization Overhaul
- Custom "Fuel Log AI" menu in Google Sheets.
- `initializeDatabase()` called defensively before every read/write.

### 🧠 v2.3 – Enhanced Receipt Intelligence
- Granular AI prompt: separate `vendor`, `city`, `area` fields.
- Backend combines them into a descriptive `notes` string.
- Yellow-ring AI-success highlight on populated fields.

### 🍱 v2.4 – GPS Notes, Standardization & Stability
- **GPS-Appended Notes:** After AI scan, GPS coordinates are fetched and appended to the Notes field.
- **Image Compression:** Client-side image resize (max 800px) and JPEG compression (0.7) before Gemini API call.
- **CNG Support:** Added CNG as a third fuel type option alongside Petrol and Diesel.
- **Neo-Brutalist 2.0:** Standardized class-based design system (`neo-card`, `neo-btn`, `neo-input`).
- **AppSheet Automation Hook:** `processAppSheetReceipt(rowId)` stub in `Code.gs`.
- **Mission Report Resilience:** High-priority z-index layering for the HUD overlay.

### 🔒 v2.8 – Code Quality & Security Hardening (Current)
- **XSS patched:** `esc()` and `safeUrl()` helpers applied to all `innerHTML` injection points; vehicle names moved from inline `onclick` string literals to `data-*` attributes.
- **Function renaming:** `ref` → `syncData`, `rend` → `renderLogs`, `sub` → `submitEntry`, `calc` → `calculateTotal`, `stats` → `renderStats`.
- **`renderVehicleSelector()` helper extracted:** shared between `syncData()` and `confirmVehicle()` — fixes missing radio button rebuild on new vehicle add.
- **Backend hardening:** `GEMINI_URL` constant, API key guard, standardized `{ success, error }` response shape, header-based `lastPrice` lookup, numeric field coercion in `saveEntryDirect()`.
- **Dead code removed:** `processAppSheetReceipt` stub deleted; dead CSS classes (`.log-date`, `.log-vehicle`, `.log-cost`, `.log-details`) removed.
- **`state.buttonColors` → `state.vehicleColorCount: 4`:** removes misleading parallel color array.
- **`package.json` aligned:** version `2.8.0`, `deploy`/`push:force` scripts added, lint target corrected.

### 🤖 v2.7 – AI Model Upgrade
- **Model Migration:** Replaced deprecated `gemini-2.0-flash` with `gemini-3.1-flash-lite` in both `processReceiptWithAI()` and `getMarketData()`.
- **Reason:** Google shut down the `gemini-2.0-flash` alias on 2026-05-25; `gemini-3.1-flash-lite` offers a 1M-token context window, improved multimodal accuracy, and grounding support.

### 🎨 v2.6 – Code Quality & Add Tab UX Overhaul
- **Semantic IDs:** All single-letter form element IDs renamed to readable semantic names.
- **Dynamic Vehicle Colors:** Hardcoded brand color classes replaced with 4 index-based `btn-color-N` classes driven by `state.buttonColors`.
- **Market Cache:** `sessionStorage` cache (4-hour TTL) added to `loadMarket()`; `renderMarket()` helper extracted for reuse by both cache-hit and fresh-fetch paths.
- **Precise Lifetime Avg:** Stats card efficiency now computed as mean of `state.efficiencies` interval values instead of inflated `(max_km − min_km) / total_fuel`.
- **Fuel Type Chips:** Dropdown replaced with `Petrol / Diesel / CNG` segmented buttons; AI scanner calls `selectFuelType()` to update chip state.
- **Odometer Toggle:** Full Tank checkbox replaced with an inline `✓ Full / Partial` pill; odometer input promoted to full width.
- **Qty Emphasis:** Dashed yellow border when Qty is empty; cleared on input and reset after save.
- **GPS Layout Fix:** Station Location and 📍 GPS button are now proper flex siblings (no text overlap).
- **Scan Menu:** Two header buttons merged into a single 📷 dropdown with outside-click dismiss.
- **Notes Collapse:** Notes textarea defaults to 1 row; expands to 4 on focus; collapses if empty on blur.

### 🛡️ v2.5 – Project Hardening & UI Refinement
- **Structural Organization:** Moved core App Script files (`Code.gs`, `Index.html`, `appsscript.json`) to the `src/` directory.
- **Neo-Brutalist 2.0 Refinement:** Standardized border widths to 2px, shadow depths to 3px, and refined the "Cyber Yellow" palette.
- **Mission Report Animation:** Redesigned the post-log report as a non-blocking bottom-sheet with a smooth `slideUp` animation.
- **Smart Vehicle Selector Logic:** Refined the logic for switching between radio buttons and dropdowns based on vehicle count.
- **Visual Feedback:** Reduced opacity and blur on the loading overlay for a less intrusive UX.

---

## 11. Repository Hygiene & Maintenance Plan

### 10.1 GitHub Best Practices
- **[x] Add `.gitignore`:** Exclude `node_modules/`, `.clasp.json` (if sensitive), and local temporary files.
- **[x] Add `LICENSE`:** Formally include the MIT license file in the root directory.
- **[x] Add `.claspignore`:** Ensure only production files (`src/*.gs`, `src/*.html`) are pushed to Google Apps Script.

### 10.2 Documentation & Metadata Alignment
- **[x] License Consistency:** Update `package.json` to reflect the "MIT" license specified in the README.
- **[x] Script Update:** Align the `processAppSheetReceipt` stub in `Code.gs` to reference the correct sheet name (`Log`) and resolve the warning in the README.

### 10.3 Tooling & Workflow Enhancements
- **[x] npm Scripts:** Add utility scripts to `package.json` for streamlined development:
  - `npm run push` (clasp push)
  - `npm run watch` (clasp push --watch)
  - `npm run lint` (eslint check)

---
**End of Document**
