# Changelog

All notable changes to Fuel Log AI are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [2.7.0] – 2026-06-07

### Changed
- Migrated AI model from deprecated `gemini-2.0-flash` to `gemini-3.1-flash-lite` in both `processReceiptWithAI()` and `getMarketData()` (`src/Code.gs`).

### Fixed
- Receipt image upload now works again — Google shut down the `gemini-2.0-flash` alias on 2026-05-25, causing a "model no longer available" error on every scan.

---

## [2.6.0] – 2026-04-28

### Added
- **Fuel Type Chips:** Petrol / Diesel / CNG rendered as tap-friendly segmented buttons; AI scanner calls `selectFuelType()` to update chip state with yellow highlight.
- **Odometer Toggle:** Full Tank moved to an inline `✓ Full / Partial` pill beside the Odometer label; odometer input promoted to full width.
- **Scan Menu:** Two header scanner buttons merged into a single 📷 dropdown with Camera / Gallery options; closes on outside tap.
- **Notes Collapse:** Notes textarea defaults to 1 row, expands to 4 on focus, collapses if empty on blur.

### Changed
- **Semantic Element IDs:** All single-letter form IDs renamed (`k`→`km-reading`, `q`→`fuel-qty`, `p`→`fuel-price`, `n`→`notes`, `l`→`pump-location`, `d`→`refill-date`, `t`→`refill-total`).
- **Dynamic Vehicle Colors:** Hardcoded brand color classes replaced with 4 index-based `btn-color-N` classes driven by `state.buttonColors`.
- **Precise Lifetime Average:** Stats card efficiency computed as mean of `state.efficiencies` interval values instead of inflated `(max_km − min_km) / total_fuel`.

### Fixed
- **GPS Layout:** Station Location input and 📍 GPS button are now proper flex siblings — no more text clipping.
- **Quantity Emphasis:** Dashed yellow border on empty Qty field; clears on input and resets after save.

### Performance
- **Market Cache:** `sessionStorage` cache (4-hour TTL) added to `loadMarket()`; `renderMarket()` helper extracted to eliminate redundant `getMarketData` API calls.

---

## [2.5.0] – 2026-03-15

### Added
- Moved core files (`Code.gs`, `Index.html`, `appsscript.json`) to `src/` directory for `clasp` compatibility.

### Changed
- Standardised border widths to 2px and shadow depths to 3px across Neo-Brutalist components.
- Refined Cyber Yellow palette (`#FFDE03`) across all interactive elements.
- Refined Smart Vehicle Selector logic for radio ↔ dropdown switching based on vehicle count.

### Fixed
- Mission Report HUD redesigned as a non-blocking bottom-sheet with `slideUp` animation.
- Loading overlay opacity and blur reduced for less intrusive UX.

---

## [2.4.0] – 2026-02-10

### Added
- **GPS-Appended Notes:** After AI scan, GPS coordinates are fetched and appended to the Notes field (`| GPS: lat, lon`).
- **Image Compression:** Client-side resize to max 800px + JPEG quality 0.7 before Gemini API call.
- **CNG Support:** Added CNG as a third fuel type alongside Petrol and Diesel.
- **AppSheet Hook:** `processAppSheetReceipt(rowId)` stub in `Code.gs` for external automation.
- **Neo-Brutalist 2.0:** Standardised class-based design system (`neo-card`, `neo-btn`, `neo-input`).

### Fixed
- Mission Report HUD z-index elevated to prevent overlay stacking issues.

---

## [2.3.0] – 2026-01-20

### Added
- **Granular AI Extraction:** Prompt updated to extract separate `vendor`, `city`, and `area` fields; backend combines into a descriptive `notes` string.
- **AI Success Highlight:** AI-populated fields receive a yellow ring (`ring-yellow-400`) for 3 seconds post-scan.

---

## [2.2.0] – 2025-12-05

### Added
- Custom "Fuel Log AI" menu in Google Sheets with **Initialize Database** option.
- `initializeDatabase()` called defensively before every read/write operation.

---

## [2.1.0] – 2025-11-12

### Added
- Card-based Log View replacing mobile-unfriendly table layout.
- Live Efficiency Gauge dots on log cards (Green ≥15 KM/L / Yellow ≥10 / Red <10).
- Smart Vehicle Selector: Radio Buttons for ≤4 vehicles, Dropdown for ≥5.
- Tab switch fade-in animation and SVG bottom-nav icons.
- Silent GPS prefetch on app load.

---

## [2.0.0] – 2025-10-08

### Added
- Dark Mode with `localStorage` persistence and CSS variable theming system.
- Toast notification system replacing native `alert()`.
- Price Memory: auto-fills last recorded fuel price on new entry.
- `inputmode="decimal"` on all numeric fields for correct mobile keypad.

---

## [1.2.0] – 2025-09-01

### Added
- Full Neo-Brutalist UI redesign: high-contrast borders, hard drop-shadows, uppercase Inter typography.
- Compact vehicle header, Math Row layout, floating Total Cost card.
- Mechanical input focus states.

---

## [1.1.0] – 2025-08-15

### Added
- `100svh` height for correct mobile browser chrome handling.
- 16px minimum font size on all inputs to prevent iOS auto-zoom.
- Mission Report HUD with Efficiency Grade (S–C scale).
- Dual-Trigger scanner: 📸 Camera vs. 📁 File.

---

## [1.0.0] – 2025-07-20

### Added
- Initial release: Google Apps Script web app with Gemini-powered receipt scanning.
- Global error management for all `google.script.run` calls.
- Fail-safe loading overlay dismissal on backend errors.
- Gemini API key moved to `PropertiesService.getScriptProperties()`.
