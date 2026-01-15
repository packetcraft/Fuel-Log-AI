# ⚡ Fuel Log AI // Protocol v2.1

> **Status:** UPLINK_ACTIVE
> **Theme:** Cyber-Obsidian // Neon Cyan
> **Engine:** Google Apps Script + Gemini 2.0 Flash

## 🌌 Overview
**Fuel Log AI** is a high-performance, mobile-optimized telemetry suite designed to track vehicle efficiency using sentient-grade AI. 

> [!IMPORTANT]
> **Serverless & Free:** This application is hosted entirely on your own Google Infrastructure using **Google Apps Script** as the engine and **Google Sheets** as the database. No external hosting, servers, or subscriptions are required.

![UI Screenshot](https://raw.githubusercontent.com/packetcraft/Fuel-Log-AI/refs/heads/main/ScreenShots2.jpg)

## 🚀 Core Protocols
- **Dual-Trigger Scanning:** Dedicated 📸 Cam (direct rear-camera access) and 📁 File (gallery explorer) triggers for maximum flexibility.
- **AI Receipt Decoding:** Pulse-scanning of fuel receipts to auto-extract Price, Quantity, and Location with 90%+ accuracy.
- **Mission Report HUD:** Real-time post-log dashboard calculating KM/L efficiency and ranking your performance (S to C Grade).
- **Dynamic Theming:** Visual protocols shift accent colors based on fuel type (Petrol-Cyan, Diesel-Red, CNG-Green).
- **Live Market Scan:** High-precision GPS uplink to fetch local fuel price insights and compare them with your pump cost.
- **Protocol Logs:** Historical data visualization with Chart.js and high-tech skeleton pulse loaders.

## 🛠️ Deployment (How to Use)
Since this project runs on Google's serverless infrastructure, you don't need to install Node.js or run a local server.

1. **Initialize Database:**
   - Create a new empty [Google Sheet](https://sheet.new). This will act as your database.

2. **Install Engine:**
   - In the Sheet, go to **Extensions > Apps Script**.
   - **Code.gs:** Copy the content from this repo's `Code.gs` into the script editor.
   - **Index.html:** Create a new HTML file ( `+` button > HTML) named `Index`, and copy the content from `Index.html`.

3. **Inject Intelligence (Environment Variables):**
   - Get your API Key from [Google AI Studio](https://aistudio.google.com/).
   - In Apps Script, go to **Project Settings** (⚙️ icon) > **Script Properties**.
   - Add a new property:
     - **Property:** `GEMINI_API_KEY`
     - **Value:** `your_actual_api_key_here`

4. **Deploy Uplink:**
   - Click **Deploy** > **New Deployment**.
   - **Select type:** Web App.
   - **Execute as:** Me.
   - **Who has access:** Anyone (if you want to share with family) or Only Myself.
   - Click **Deploy** and grant the necessary permissions.

5. **Launch:**
   - Copy the **Web App URL**.
   - Open it on your phone's browser.
   - Tap **Share > Add to Home Screen** for a full-screen, app-like experience.

## 📱 Mobile Optimization
The interface is engineered with **svh (Small Viewport Height)** resilience and **16px anti-zoom** triggers to ensure a native-app experience on iOS and Android devices without the overhead of an app store.

## 💾 Database Logic
All telemetry is stored in a structured [Google Sheet](https://docs.google.com/spreadsheets/). The application automatically initializes the required headers in the **Log** tab on first uplink, and dynamically manages vehicle protocols based on your history.

## 👥 Multi-User Protocol (Family Sharing)
To log data to the same central database across multiple devices:
1. **Share the Sheet:** Open the underlying Google Sheet and click **Share**. Add family members as **Editors**.
2. **Web App Access:** When deploying the script, set **"Who has access"** to **"Anyone"**. 
3. **The Link:** Send them the Web App URL. They can now log refills from their own devices, and the "Vehicle Protocol" dropdown will allow them to select their specific car.

---
**Developed by:** [Your Name/Agency]  
**License:** MIT Protocol  
*"Drive optimized. Log AI."*
