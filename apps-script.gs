// Paste into a Google Sheet: Extensions > Apps Script. Then Deploy > New deployment >
// Web app, "Execute as: Me", "Who has access: Anyone". Copy the URL into js/config.js (sheetUrl).
// If you change this list, change the header row of the sheet to match.
const HEADERS = ["timestamp", "name", "attending", "plusOne", "excited", "cry", "gift", "outfit", "dance", "diet", "song", "note", "lang"];

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  const d = JSON.parse(e.postData.contents);
  sheet.appendRow(HEADERS.map((h) => (h === "attending" ? (d[h] ? "YES" : "NO") : d[h] || "")));
  return ContentService.createTextOutput("ok");
}
