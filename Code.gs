const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Fuel Log AI // Protocol')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getDataProtocol() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Log') || ss.insertSheet('Log');
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['vehicle_name', 'km_reading', 'fuel_qty', 'refill_amount', 'fuel_price', 'refill_date', 'pump_location', 'full_tank', 'notes']);
    } else {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (!headers.map(h => h.toString().trim()).includes('notes')) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue('notes');
      }
    }
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