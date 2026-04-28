# ⚡ Fuel Log AI // Protocol v2.6

> **Status:** UPLINK_ACTIVE  
> **Theme:** Neo-Brutalist // Cyber-Yellow  
> **Engine:** Google Apps Script + Gemini 2.0 Flash

## 🌌 Overview

Fuel Log AI — Mobile Receipt Scanning & Analytics

**Version:** 2.6.0 (Code Quality + UX Polish)  
**Engine:** Gemini 2.0 Flash (Structured Outputs)

An AI-powered vehicle expense tracker built on **Google Apps Script** + **Gemini**.
This application uses AI to scan fuel receipts and provide location-aware market insights.

### 🌟 New in v2.6.0
- **Fuel Type Chips**: Petrol / Diesel / CNG now displayed as tap-friendly segmented buttons instead of a dropdown.
- **Odometer Toggle**: Full Tank is now an inline `✓ Full / Partial` pill beside the Odometer label, freeing a full grid column.
- **Smarter Add Form**: Quantity field highlights with a dashed yellow border when empty; Notes collapses to 1 row by default.
- **Scan Menu**: Two scanner buttons merged into a single 📷 button with a Camera / Gallery sub-menu.
- **GPS Fix**: Station Location input no longer clips text behind the 📍 pin button.
- **Dynamic Vehicle Colors**: Vehicle radio buttons use index-based colors instead of hardcoded brand names.
- **Market Cache**: Live market data is cached in `sessionStorage` with a 4-hour TTL — no redundant API calls per session.
- **Precise Efficiency**: Stats lifetime average now derived from correctly-calculated interval efficiencies, not inflated `max−min` odometer math.
- **Semantic IDs**: All single-letter form element IDs renamed to readable names (`km-reading`, `fuel-qty`, `fuel-price`, etc.).

![UI Screenshot](https://raw.githubusercontent.com/packetcraft/Fuel-Log-AI/refs/heads/main/ScreenShots2.jpg)

---

## 🚀 Core Features

| Feature | Description |
| :--- | :--- |
| 📷 **Scan Receipt Menu** | Single 📷 button expands to Camera (rear-camera) or Gallery sub-menu |
| 🤖 **AI Receipt Decoding** | Gemini 2.0 Flash extracts Qty, Price, Vendor, City & Area from receipt images |
| 📍 **GPS-Appended Notes** | After AI scan, GPS coordinates are fetched and appended to Notes automatically |
| 🗜️ **Image Compression** | Client-side resize to max 800px + 0.7 JPEG quality before API call |
| 🎖️ **Mission Report HUD** | **[NEW]** Animated bottom-sheet overlay showing KM/L efficiency and S–C Grade |
| 🚗 **Smart Vehicle Selector** | Radio buttons (≤4 vehicles) or dropdown (5+), with dynamic index-based accent colors |
| 💰 **Live Market Scan** | GPS-based city lookup → Gemini fetches today's Petrol/Diesel prices with sources; cached 4 hrs in `sessionStorage` |
| 📊 **Stats & Charts** | Per-vehicle KM/L summary + Chart.js efficiency trend line with tap-to-inspect tooltips |
| 🃏 **Card Log View** | Last 50 refills as scannable cards with Efficiency Dots (🟢🟡🔴) |
| 🌙 **Dark Mode** | Manual toggle (🌓), persisted via `localStorage`, full CSS-variable theming |
| 📝 **Station Autocomplete** | `<datalist>` suggests previously used pump locations |
| ⚡ **Price Memory** | Auto-fills last recorded fuel price on new entry |
| ⛽ **Fuel Types** | Petrol / Diesel / CNG |
| 🔗 **AppSheet Hook** | `processAppSheetReceipt()` backend stub for external automation workflows |

---

## 🛠️ Deployment (How to Use)
Since this project runs on Google's serverless infrastructure, you don't need to install Node.js or run a local server.

### 1. Initialize Database
- Create a new empty [Google Sheet](https://sheet.new). This will act as your database.
- The sheet header row and formatting are created automatically on first use.
- Alternatively, use the **Fuel Log AI > Initialize Database** spreadsheet menu after installing the script.

### 2. Install Engine
- In your Sheet, go to **Extensions > Apps Script**.
- **Code.gs:** Paste the contents of `src/Code.gs` into the editor (replacing the default `myFunction` stub).
- **Index.html:** Click the `+` button > **HTML**, name the file `Index`, and paste the contents of `src/Index.html`.

### 🛠️ Local Development (Advanced)
For power users, it is recommended to use **[clasp](https://github.com/google/clasp)** (Command Line Apps Script Projects). This allows you to develop locally using VS Code, use Git for version control, and push code without copy-pasting.

> [!TIP]
> This project is configured to use the `src/` directory as the source root. All `.gs` and `.html` files **must** reside in `src/` to be correctly synced.

**1st Time Setup:**
```bash
# 1. Install clasp globally
npm install -g @google/clasp

# 2. Enable Apps Script API
# Visit: https://script.google.com/home/usersettings and toggle to "ON"

# 3. Login to your Google account
clasp login

# 4. Link the project
# Copy the template and paste your Google Apps Script Project ID
cp .clasp.json.example .clasp.json

# (Or alternatively, use clasp clone which overwrites the config)
# clasp clone "your_script_id_here" --rootDir src
```

**Regular Maintenance:**
```bash
# Pull remote changes from Google Drive to local /src
clasp pull

# Push local changes from /src to the cloud
clasp push

# Open the Apps Script IDE in your browser
clasp open-script

# Open the deployed web app in your browser
clasp open-web-app
```

### 3. Inject Intelligence (API Key)
- Get your free API Key from [Google AI Studio](https://aistudio.google.com/).
- In Apps Script, go to **Project Settings** (⚙️) > **Script Properties**.
- Add a new property:
  - **Property:** `GEMINI_API_KEY`
  - **Value:** `your_actual_api_key_here`

### 4. Deploy
- Click **Deploy** > **New Deployment**.
- **Select type:** Web App.
- **Execute as:** Me.
- **Who has access:** Anyone (for family sharing) or Only Myself.
- Click **Deploy** and grant the requested permissions.

### 5. Launch
- Copy the **Web App URL**.
- Open it on your phone's browser.
- Tap **Share > Add to Home Screen** for a full-screen, app-like experience.

---

## 📱 Mobile Optimization
- **`100svh`** height handles mobile browser chrome transitions smoothly.
- **16px min font size** on all inputs prevents iOS auto-zoom on focus.
- **`inputmode="decimal"`** triggers the correct numeric keypad on mobile.
- **`viewport-fit=cover`** fills the screen edge-to-edge on notched devices.

---

## 💾 Database Schema
All data is stored in the `Log` sheet tab. Headers are auto-created on first run:

| Column | Type | Notes |
| :--- | :--- | :--- |
| `vehicle_name` | String | Selected vehicle |
| `km_reading` | Float | Odometer at refill |
| `fuel_qty` | Float | Liters added |
| `refill_amount` | Float | Total cost (₹) |
| `fuel_price` | Float | Price per liter |
| `refill_date` | Date | `YYYY-MM-DD` |
| `pump_location` | String | Station name or GPS coords |
| `full_tank` | Boolean | Whether tank was filled to full |
| `notes` | String | AI vendor+location + optional GPS coords |
| `fuel_type` | String | Type of fuel (petrol, diesel, cng) |

---

## 👥 Multi-User (Bro Sharing)
1. **Share the Sheet:** Click **Share** on the Google Sheet and add collegues/family members as **Editors**.
2. **Web App Access:** Set **"Who has access"** to **"Anyone"** during deployment.
3. **The Link:** Send them the Web App URL. Each user selects their vehicle from the Smart Vehicle Selector.

---

> [!NOTE]
> **AppSheet Integration:** The `processAppSheetReceipt(rowId)` function in `Code.gs` is a backend stub intended for AppSheet/automation workflows.

---

**Developed by:** [Packetcraft](https://github.com/packetcraft)  
**License:** MIT  
*"Drive optimized. Log AI."*
