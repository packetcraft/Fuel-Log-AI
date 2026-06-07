const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=' + GEMINI_API_KEY;

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

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

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
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function getFuelData() {
  try {
    initializeDatabase();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Log');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const logVehicles = [...new Set(rows.map(r => r[0]))].filter(v => v);
    let storedVehicles = [];
    try {
      const stored = PropertiesService.getScriptProperties().getProperty('SAVED_VEHICLES');
      if (stored) storedVehicles = JSON.parse(stored);
    } catch (e) {}
    const vehicles = [...new Set([...logVehicles, ...storedVehicles])];

    const priceIdx = headers.map(h => h.toString().trim()).indexOf('fuel_price');
    const lastPrice = rows.length > 0 && priceIdx >= 0 ? rows[rows.length - 1][priceIdx] : 0;

    const formattedData = rows.map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const val = row[i];
        obj[h.toString().trim()] = (val instanceof Date) ? val.toISOString() : val;
      });
      return obj;
    });
    return { success: true, data: formattedData.reverse(), vehicles: vehicles, lastPrice: lastPrice };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function saveEntryDirect(entry) {
  try {
    initializeDatabase();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Log');
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    const numericFields = ['km_reading', 'fuel_qty', 'refill_amount', 'fuel_price'];
    numericFields.forEach(f => { if (entry[f] !== undefined) entry[f] = parseFloat(entry[f]) || 0; });
    if (entry.full_tank !== undefined) entry.full_tank = entry.full_tank === true || entry.full_tank === 'true';

    const newRow = headers.map(h => {
      const key = h.toString().trim();
      return (entry[key] !== undefined) ? entry[key] : "";
    });
    sheet.appendRow(newRow);
    return { success: true };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function processReceiptWithAI(base64Image) {
  if (!GEMINI_API_KEY) return { success: false, error: "GEMINI_API_KEY not configured in Script Properties." };

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
    const response = UrlFetchApp.fetch(GEMINI_URL, {
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

    const extractedData = JSON.parse(result.candidates[0].content.parts[0].text);
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
  if (!GEMINI_API_KEY) return { success: false, error: "GEMINI_API_KEY not configured in Script Properties." };

  try {
    const geocode = Maps.newGeocoder().reverseGeocode(lat, lon);
    const city = geocode.results[0].address_components.find(c => c.types.includes("locality"))?.long_name || "Major Cities";
    const prompt = `Petrol and diesel prices today in ${city}, India. User last: ${lastPrice}.`;

    const searchResponse = UrlFetchApp.fetch(GEMINI_URL, {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify({
        "contents": [{ "parts": [{ "text": prompt }] }],
        "tools": [{ "google_search": {} }]
      }),
      "muteHttpExceptions": true
    });

    const searchResult = JSON.parse(searchResponse.getContentText());
    if (searchResponse.getResponseCode() !== 200) {
      return { success: false, error: searchResult.error?.message || "Market Search API failed" };
    }

    const rawData = searchResult.candidates[0].content.parts[0].text;
    const groundingChunks = searchResult.candidates[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter(c => c.web)
      .map(c => ({ title: c.web.title || "Source", url: c.web.uri }))
      .slice(0, 3);

    const extractResponse = UrlFetchApp.fetch(GEMINI_URL, {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify({
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
      }),
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
