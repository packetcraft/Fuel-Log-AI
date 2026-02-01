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
 * Initializes the Google Sheet with necessary headers and formatting.
 * Can be called manually from the menu or automatically on first run.
 */
function initializeDatabase() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Log');
    if (!sheet) {
      sheet = ss.insertSheet('Log');
    }

    const requiredHeaders = ['vehicle_name', 'km_reading', 'fuel_qty', 'refill_amount', 'fuel_price', 'refill_date', 'pump_location', 'full_tank', 'notes'];

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
    const vehicles = [...new Set(rows.map(r => r[0]))].filter(v => v);
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

/**
 * Generic function to save entry data based on existing sheet headers.
 * This automatically handles new columns like 'notes' if they exist in headers.
 */
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
  const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=' + GEMINI_API_KEY;
  const payload = { "contents": [{ "parts": [{ "text": "Extract fuel receipt data: {fuel_qty, fuel_price, refill_amount, refill_date, pump_location}. Return raw JSON." }, { "inline_data": { "mime_type": "image/jpeg", "data": base64Image } }] }] };
  try {
    const response = UrlFetchApp.fetch(url, { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload) });
    const result = JSON.parse(response.getContentText());
    const json = result.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    return { success: true, data: JSON.parse(json) };
  } catch (e) { return { success: false }; }
}

function getMarketData(lat, lon, lastPrice) {
  try {
    const geocode = Maps.newGeocoder().reverseGeocode(lat, lon);
    const city = geocode.results[0].address_components.find(c => c.types.includes("locality"))?.long_name || "Major Cities";
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY;
    const prompt = `Petrol and diesel prices today in ${city}, India. User last: ${lastPrice}. Return JSON {city, petrol, diesel, insight, sources: [{title, url}]}.`;
    const response = UrlFetchApp.fetch(url, { "method": "post", "contentType": "application/json", "payload": JSON.stringify({ "contents": [{ "parts": [{ "text": prompt }] }], "tools": [{ "google_search": {} }] }) });
    const result = JSON.parse(response.getContentText());
    const json = result.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    return { success: true, market: JSON.parse(json) };
  } catch (e) { return { success: false }; }
}



// New wrapper function for AppSheet
function processAppSheetReceipt(rowId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Logs");
  const data = sheet.getDataRange().getValues();
  
  // 1. Find the row by ID
  // 2. Get the Image URL from the "Receipt Image" column
  // 3. Fetch the image bytes
  // 4. Call your existing 'uploadImageToGemini' logic
  // 5. sheet.getRange(rowIndex, colIndex).setValue(results)
}
