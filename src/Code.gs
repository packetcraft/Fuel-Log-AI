const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Fuel Log AI')
    .addItem('Initialize Database', 'initializeDatabase')
    .addToUi();
}

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Fuel Log AI // Protocol')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper to include other HTML files in the main template.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Initializes the Google Sheet with necessary headers and formatting.
 */
function initializeDatabase() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Log');
    if (!sheet) {
      sheet = ss.insertSheet('Log');
    }

    const requiredHeaders = ['vehicle_name', 'km_reading', 'fuel_qty', 'refill_amount', 'fuel_price', 'refill_date', 'pump_location', 'full_tank', 'notes', 'fuel_type'];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(requiredHeaders);
      sheet.getRange(1, 1, 1, requiredHeaders.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    } else {
      const existingHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0].map(h => h.toString().trim());
      requiredHeaders.forEach(h => {
        if (!existingHeaders.includes(h)) {
          sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
        }
      });
    }
    return { success: true, message: "Database initialized successfully." };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function getDataProtocol() {
  try {
    initializeDatabase();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Log');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Merge log vehicles and stored vehicles
    const logVehicles = [...new Set(rows.map(r => r[0]))].filter(v => v);
    let storedVehicles = [];
    try {
      const stored = PropertiesService.getScriptProperties().getProperty('SAVED_VEHICLES');
      if (stored) storedVehicles = JSON.parse(stored);
    } catch (e) {}
    const vehicles = [...new Set([...logVehicles, ...storedVehicles])];
    const lastPrice = rows.length > 0 ? rows[rows.length - 1][4] : 0;

    const formattedData = rows.map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        obj[h.toString().trim()] = (val instanceof Date) ? val.toISOString() : val;
      });
      return obj;
    });
    return { success: true, data: formattedData.reverse(), vehicles: vehicles, lastPrice: lastPrice };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function saveEntryDirect(entry) {
  try {
    initializeDatabase();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Log');
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(h => {
      const key = h.toString().trim();
      return (entry[key] !== undefined) ? entry[key] : "";
    });
    sheet.appendRow(newRow);
    return { success: true };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function processReceiptWithAI(base64Image) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY;
  
  const promptText = `Analyze this fuel receipt image and extract data into the specified format. Focus on vendor, total volume, rate, total cost, date, and location.`;

  const payload = {
    "contents": [{
      "parts": [
        { "text": promptText },
        { "inline_data": { "mime_type": "image/jpeg", "data": base64Image } }
      ]
    }],
    "generationConfig": {
      "response_mime_type": "application/json",
      "response_schema": {
        "type": "object",
        "properties": {
          "vendor": { "type": "string" },
          "fuel_qty": { "type": "number" },
          "fuel_price": { "type": "number" },
          "refill_amount": { "type": "number" },
          "refill_date": { "type": "string", "description": "YYYY-MM-DD format" },
          "city": { "type": "string" },
          "area": { "type": "string" },
          "fuel_type": { "type": "string", "enum": ["petrol", "diesel", "cng"], "description": "Type of fuel" }
        },
        "required": ["vendor", "fuel_qty", "fuel_price", "refill_amount", "refill_date", "city", "area", "fuel_type"]
      }
    }
  };

  try {
    const response = UrlFetchApp.fetch(url, {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    });

    const responseCode = response.getResponseCode();
    const result = JSON.parse(response.getContentText());

    if (responseCode !== 200) {
      console.error("API Error:", result);
      return { success: false, error: result.error?.message || "API call failed" };
    }

    let extractedData = JSON.parse(result.candidates[0].content.parts[0].text);

    // Combine Vendor and Location for notes
    const vendor = extractedData.vendor || "Fuel Station";
    const locationParts = [extractedData.area, extractedData.city].filter(part => part && part.trim() !== "");
    const locationStr = locationParts.length > 0 ? locationParts.join(", ") : "Unknown Location";
    extractedData.notes = `${vendor} - ${locationStr}`;

    return { success: true, data: extractedData };

  } catch (e) {
    console.error("Exception:", e);
    return { success: false, error: e.toString() };
  }
}

function getMarketData(lat, lon, lastPrice) {
  try {
    const geocode = Maps.newGeocoder().reverseGeocode(lat, lon);
    const city = geocode.results[0].address_components.find(c => c.types.includes("locality"))?.long_name || "Major Cities";
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY;
    const prompt = `Petrol and diesel prices today in ${city}, India. User last: ${lastPrice}.`;
    
    // Step 1: Search for prices with Grounding
    const searchPayload = {
      "contents": [{ "parts": [{ "text": prompt }] }],
      "tools": [{ "google_search": {} }]
    };

    const searchResponse = UrlFetchApp.fetch(url, {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(searchPayload),
      "muteHttpExceptions": true
    });
    
    const searchResult = JSON.parse(searchResponse.getContentText());
    if (searchResponse.getResponseCode() !== 200) {
      return { success: false, error: searchResult.error?.message || "Market Search API failed" };
    }
    
    const rawData = searchResult.candidates[0].content.parts[0].text;
    // Grounding sources live in groundingMetadata, not in the text — extract them here
    const groundingChunks = searchResult.candidates[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter(c => c.web)
      .map(c => ({ title: c.web.title || "Source", url: c.web.uri }))
      .slice(0, 3);

    // Step 2: Extract structured data from the raw text (no sources — those come from grounding above)
    const extractPayload = {
      "contents": [{ "parts": [{ "text": `Extract petrol and diesel fuel prices for India from this text. If a price is not found, use 0. Text: ${rawData}` }] }],
      "generationConfig": {
        "response_mime_type": "application/json",
        "response_schema": {
          "type": "object",
          "properties": {
            "city": { "type": "string" },
            "petrol": { "type": "number" },
            "diesel": { "type": "number" },
            "insight": { "type": "string" }
          },
          "required": ["city", "petrol", "diesel", "insight"]
        }
      }
    };

    const extractResponse = UrlFetchApp.fetch(url, {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(extractPayload),
      "muteHttpExceptions": true
    });
    
    const extractResult = JSON.parse(extractResponse.getContentText());
    if (extractResponse.getResponseCode() !== 200) {
      return { success: false, error: extractResult.error?.message || "Market Extraction API failed" };
    }

    const market = JSON.parse(extractResult.candidates[0].content.parts[0].text);
    market.sources = sources;
    return { success: true, market: market };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function processAppSheetReceipt(rowId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Log");
  // Stub for future use
}

function addVehicle(name) {
  try {
    const props = PropertiesService.getScriptProperties();
    let stored = [];
    const saved = props.getProperty('SAVED_VEHICLES');
    if (saved) stored = JSON.parse(saved);
    if (!stored.includes(name)) {
      stored.push(name);
      props.setProperty('SAVED_VEHICLES', JSON.stringify(stored));
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}
