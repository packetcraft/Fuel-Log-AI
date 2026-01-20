# Product Requirement Document (PRD): Fuel Log AI

**Version:** 1.0  
**Status:** Draft  
**Date:** 2026-01-10  
**Author:** Product Management Team (AI)

---

## 1. Executive Summary
**Fuel Log AI** is a mobile-first web application designed to simplify vehicle expense tracking. Leveraging Google Gemini 2.0 AI, the application automates data entry by extracting details directly from fuel receipts and provides real-time market insights on fuel prices. The system is built on Google Apps Script (GAS) with Google Sheets as the database, ensuring a lightweight, cost-effective, and highly accessible solution.

## 2. Product Objectives
- **Minimize User Effort:** Reduce manual data entry by 80% using AI-powered receipt scanning.
- **Accuracy:** ensure precise tracking of mileage (KM readings), fuel quantity, and costs.
- **Insight:** Provide users with contextual data (local market prices) to inform purchasing decisions.
- **Accessibility:** Deliver a seamless experience across mobile devices via a responsive web interface.

## 3. User Personas
1.  **The Daily Commuter:** Wants to quickly log a refill at the pump without fumbling with numbers.
2.  **The Fleet Driver:** Needs to report accurate expense data to managers with proof (receipts) and location data.
3.  **The Cost-Conscious Owner:** Tracks fuel efficiency and compares pump prices to market averages.

## 4. Feature Scope (MoSCoW)

### Must Have (P0)
-   **AI Receipt Scanning:**  
    -   User captures/uploads a receipt image.
    -   **Dual-Trigger Input:** Specific buttons for direct Camera access vs. File explorer.
    -   System extracts: `Fuel Quantity`, `Fuel Price`, `Total Amount`, `Date`, `Pump Location`.
    -   Backend Model: Gemini 2.0 Flash-Lite (for speed and cost-efficiency).
-   **Manual Entry & Validation:**  
    -   User can edit AI-extracted values or enter data manually if no receipt is available.
    -   Mandatory fields: `Vehicle Name`, `KM Reading`, `Amount`, `Price`.
    -   Optional fields: `Notes` (pure text).
-   **Data Persistence:**  
    -   Save all records to a Google Sheet ('Log' tab).
    -   Auto-initialization of sheet headers if missing.
-   **Vehicle Management:**  
    -   Support multiple vehicles.
    -   Dropdown selection based on historical usage.
-   **Historical Log View:**  
    -   Chronological list of past refills (Date, Vehicle, Amount, KM).
    -   Visual indicator for "Full Tank" refills.

### Should Have (P1)
-   **Market Price Insights:**  
    -   Fetch current Petrol/Diesel prices for the user's current city.
    -   Compare user's paid price vs. market average.
    -   Backend: Gemini 2.0 Flash + Google Maps Reverse Geocoding.
-   **Mobile Optimization:**  
    -   Viewport configuration for proper scaling (`user-scalable=no`).
    -   Touch-friendly input fields.
-   **Mission Report HUD:**
    -   Post-log success screen with Efficiency Grade (S-C).
    -   Real-time trend analysis (+/- %) vs. previous refill.
-   **Dynamic Theme Switching:**
    -   UI color shift based on selected Fuel Type (Cyan, Red, Green).

### Could Have (P2)
-   **Mileage Calculation:** Auto-calculate MPG/KMPL between full tanks.
-   **Charts/Analytics:** Visual trend of fuel prices over time.

---

## 5. Functional Requirements

### 5.1 Receipt Processing (AI)
| ID | Requirement Description | Technical Implementation Reference |
| :--- | :--- | :--- |
| **FR-01** | System must accept image uploads (JPEG/PNG) and convert to Base64. | Frontend `FileReader` |
| **FR-02** | System must send Base64 image to Gemini 2.0 Flash-Lite for entity extraction. | `processReceiptWithAI(base64Image)` |
| **FR-03** | Extracted JSON must be pre-filled into the entry form. | Frontend Form Population |

### 5.2 Data Management
| ID | Requirement Description | Technical Implementation Reference |
| :--- | :--- | :--- |
| **FR-04** | System shall start with a blank 'Log' sheet and append headers automatically on first run. | `getDataProtocol()` lines 15-17 |
| **FR-05** | Entries must handle specific data types: String (Vehicle), Float (Price/Qty), Date (Refill Date), String (Notes). | `saveEntryDirect(entry)` |
| **FR-06** | System must retrieve historical data in reverse chronological order for the dashboard. | `getDataProtocol()` line 32 |

### 5.3 Location & Market Data
| ID | Requirement Description | Technical Implementation Reference |
| :--- | :--- | :--- |
| **FR-07** | System obtains user's Lat/Lon (with permission). | Geolocation API |
| **FR-08** | System resolves Lat/Lon to "Locality" or City name. | `Maps.newGeocoder()` in `getMarketData` |
| **FR-09** | System queries Gemini for current market rates in that city. | `getMarketData` with `google_search` tool |

---

## 6. User Interface (UI) Requirements

The application's UI follows a "Neo-Brutalist" design philosophy, characterized by high-contrast elements, thick borders, hard shadows, and a heavy, uppercase font (`Inter`).

1.  **Main Screen & Navigation:**
    -   A tab-based interface provides access to four main sections: "Add," "Logs," "Stats," and "Market."
    -   The header contains the application title ("Fuel Log AI") and quick-access buttons for receipt scanning ("Cam" and "File").

2.  **"Add" Tab (Entry Form):**
    -   **Vehicle Management:** A compact, split-header design with "VEHICLE" on the left and a `+ Add` link on the right.
    -   **Iconography:** Labels are enhanced with icons for quick recognition: `🏎️ Odometer`, `⛽ Type`, `📍 Station`.
    -   **Math Row Layout:** The "Quantity," "Price / L," and "Total Cost" fields are visually grouped in a single card to make the calculation intuitive.
    -   **Floating Calculation Card:** The "Total Cost" is a non-editable, high-visibility display card with a distinct yellow background.
    -   **Input Focus States:** Input fields have a "mechanical" feel, shifting position and shadow on focus.

## 7. Technical Constraints & Architecture
-   **Platform:** Google Apps Script Web App (`doGet`).
-   **Zero-Cost Hosting:** The application is entirely self-hosted within the user's Google Workspace/Drive account, requiring no external VPC or server instances.
-   **Templating:** Server-side HTML template (`HtmlService`).
-   **Quotas:** Subject to Consumer/Workspace Gmail quotas for `UrlFetchApp` and Script runtimes.
-   **Security:** API Keys (Gemini) must be handled securely (currently hardcoded in `Code.gs` line 1 - **Recommendation: Move to Script Properties**).

## 8. Success Metrics
-   **Task Completion Time:** < 30 seconds to log a fuel stop.
-   **AI Accuracy:** > 90% correct extraction of Total Amount and Date.

---

## 9. Current Implementation Status (v1.0)

The following core improvements were implemented to transform the initial prototype into a production-ready application:

### 🛡️ Resilience & Error Handling
- **Global Error Management:** Added `handleError` logic to all `google.script.run` calls, preventing UI lock-ups during network or quota failures.
- **Fail-Safe States:** loading overlays are now programmatically dismissed if a backend error occurs.

### 📱 Mobile UI Optimization
- **Dynamic Viewport:** Switched to `100svh` to handle mobile browser chrome transitions smoothly.
- **iOS Resilience:** Enforced `16px` font sizes for all inputs and labels to prevent disruptive "layout zooming" on focus.
- **Improved UX:** Increased label readability and touch targets for mobile users.

### ✨ Visual Logic & Feedback
- **AI Pulse Animation:** Inputs now "pulse" with a cyan glow when successfully populated by the Gemini receipt extraction logic.
- **GPS Precision:** Geolocation requests now use high-accuracy mode with improved timeout handling.

### 🔒 Security & Backend
- **Key Management:** Replaced hardcoded API keys with `PropertiesService` (Script Properties) for secure environment variable handling.

### 🎮 Gamification & Engagement (v1.1)
- **Mission Report HUD:** Implemented a full-screen "Uplink Confirmed" HUD that calculates KM/L and assigns an Efficiency Grade (S, A, B, C) instantly after logging.
- **Skeleton States:** Replaced generic loaders with high-tech skeleton pulse animations for the Logs and Stats tabs.
- **Dual-Trigger Scanner:** Updated UI to provide explicit "📸 Cam" and "📁 File" options, resolving browser-specific "image-only" capture issues.

### ✨ UI Redesign (v1.2)
- **Neo-Brutalism Theme:** Refactored the entire UI to a "Neo-Brutalist" aesthetic, featuring a high-contrast color palette, thick borders, hard shadows, and a heavy, uppercase font.
- **Improved UX:** Implemented several UX enhancements, including a compact vehicle management header, a "floating" calculation card, a "Math Row" layout for intuitive calculations, and enhanced iconography.
- **Mechanical Focus States:** Added dynamic focus states to input fields to create a "mechanical" feel when a user interacts with them.


### 🚀 v2.0 UX Overhaul (Current)
- **Dark Mode Protocol:** Implemented a system-aware Dark Mode with a manual toggle (`localStorage` persistence).
- **Non-blocking Feedback:** Replaced native `alert()` blocking calls with a custom non-blocking "Toast" notification system for success/error states.
- **Smart Logic:**
    - **Price Memory:** Auto-fills "Price/L" with the last recorded value to speed up entry.
    - **Keypad Optimization:** Force-enables decimal/numeric keypads on mobile devices for Odometer, Quantity, and Price fields (`inputmode="decimal"`).
- **Micro-interactions:** Added tactile "press" animations to buttons and smooth transitions for theme switching.

### 💎 v2.1 Polish & Advanced Interaction (Current)
- **Refined Neobrutalism:** Softened typography (Title Case labels, lighter weights) to reduce visual fatigue while maintaining the bold aesthetic.
- **Card-Based Log View:** Replaced the mobile-unfriendly table with a stacked Card layout for log entries, improving readability and touch targets.
- **Live Efficiency Gauge:** Added "Traffic Light" dots (Green/Yellow/Red) to log cards for instant visual feedback on fuel efficiency.
- **Smart Vehicle Selector:** Automatically toggles between a Dropdown (for >3 vehicles) and large Radio Buttons (for <=3 vehicles) to reduce clicks.
- **Fluid Navigation:** Implemented smooth "Lift & Fade" animations for tab switching and added iconography to the bottom navigation bar.
- **Silent Auto-Location:** GPS coordinates are now fetched silently on app load to minimize friction during data entry.
- **Interactive Charts:** Enabling "Touch-to-View" on the Stats chart allows users to inspect specific log details directly from the graph.

---
**End of Document**
