# ⚡ Fuel Log AI // Protocol v2.1

> **Status:** UPLINK_ACTIVE
> **Theme:** Cyber-Obsidian // Neon Cyan
> **Engine:** Google Apps Script + Gemini 2.0 Flash

## 🌌 Overview
**Fuel Log AI** is a high-performance, mobile-optimized telemetry suite designed to track vehicle efficiency using sentient-grade AI. By combining Google's Gemini 2.0 with the flexibility of Google Sheets, it transforms the mundane task of fuel logging into a rewarding feedback loop.

![UI Screenshot](https://raw.githubusercontent.com/packetcraft/Fuel-Log-AI/refs/heads/main/ScreenShots.png) *(Note: Replace with actual screenshot path)*

## 🚀 Core Protocols
- **AI Receipt Decoding:** Pulse-scanning of fuel receipts to auto-extract Price, Quantity, and Location with 90%+ accuracy.
- **Mission Report HUD:** Real-time post-log dashboard calculating KM/L efficiency and ranking your performance (S to C Grade).
- **Dynamic Theming:** Visual protocols shift accent colors based on fuel type (Petrol-Cyan, Diesel-Red, CNG-Green).
- **Live Market Scan:** High-precision GPS uplink to fetch local fuel price insights and compare them with your pump cost.
- **Protocol Logs:** Historical data visualization with Chart.js and high-tech skeleton pulse loaders.

## 🛠️ Deployment (Uplink Setup)
1. **Repository Link:** Clone this protocol to your local deck.
2. **Backend Config:** Create a new [Google Apps Script](https://script.google.com/) project.
3. **Environment Variables:**
   - Open **Project Settings** > **Script Properties**.
   - Add `GEMINI_API_KEY`: [Get your key from Google AI Studio](https://aistudio.google.com/).
4. **Publish:** Deploy as a **Web App**. Set access to "Anyone with a Google Account" for personal use.

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
