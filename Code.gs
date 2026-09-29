const SPREADSHEET_ID = ''; // ถ้าเป็นโปรเจกต์ Apps Script ที่สร้างจาก Google Sheets โดยตรง ให้เว้นว่างได้
const SHEET_NAME = '';     // เว้นว่างเพื่อใช้ชีตแรก
const HEADER_ROW = 4;

// อ่านเฉพาะคอลัมน์ที่เว็บไซต์ต้องใช้จริง เพื่อลดเวลาประมวลผล
const COLS = {
  C: 3, E: 5, H: 8, I: 9, J: 10, K: 11, L: 12, Q: 17,
  EO: 145, EP: 146, EQ: 147, ER: 148, ES: 149
};

const CACHE_KEY = 'TWP71_DATA_V4';
const CACHE_SECONDS = 240; // 4 นาที

function doGet(e) {
  const callback = e && e.parameter && e.parameter.callback;
  const fresh = String(e && e.parameter && e.parameter.fresh || '') === '1';
  let payload;

  try {
    if (!fresh) {
      payload = readCache_();
    }

    if (!payload) {
      payload = getData_();
      writeCache_(payload);
    }
  } catch (err) {
    // ถ้าโหลดจากชีตมีปัญหา ให้คืนข้อมูล cache เดิม เพื่อไม่ให้หน้าเว็บว่าง
    const cached = readCache_();
    payload = cached || {
      ok: false,
      error: String(err && err.message ? err.message : err),
      data: []
    };
  }

  const json = JSON.stringify(payload);
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function getData_() {
  const ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error('ไม่พบไฟล์ Google Sheets กรุณาสร้าง Apps Script จาก Google Sheets หรือใส่ Spreadsheet ID');
  }

  const sheet = SHEET_NAME
    ? ss.getSheetByName(SHEET_NAME)
    : ss.getSheets()[0];

  if (!sheet) throw new Error('ไม่พบชีตข้อมูล');

  const lastRow = sheet.getLastRow();
  if (lastRow <= HEADER_ROW) {
    return { ok: true, updatedAt: formatUpdatedAt_(), rowCount: 0, data: [] };
  }

  const rowCount = lastRow - HEADER_ROW;
  const startRow = HEADER_ROW + 1;

  // แทนการอ่าน A:ES (149 คอลัมน์) ให้อ่านเพียง C:Q และ EO:ES (รวม 20 คอลัมน์)
  const left = sheet.getRange(startRow, 3, rowCount, 15).getDisplayValues();
  const right = sheet.getRange(startRow, 145, rowCount, 5).getDisplayValues();

  const data = [];
  for (let i = 0; i < rowCount; i++) {
    const a = left[i];
    const b = right[i];

    const x = {
      C: normalize_(a[0]),      // C
      E: normalize_(a[2]),      // E
      H: normalize_(a[5]),      // H
      I: normalize_(a[6]),      // I
      J: normalize_(a[7]),      // J
      K: normalize_(a[8]),      // K
      L: normalize_(a[9]),      // L
      Q: normalize_(a[14]),     // Q
      EO: normalize_(b[0]),     // EO
      EP: normalize_(b[1]),     // EP
      EQ: normalize_(b[2]),     // EQ
      ER: normalize_(b[3]),     // ER
      ES: normalize_(b[4]),     // ES
      row: startRow + i
    };

    // เก็บเฉพาะแถวที่มีข้อมูลจริงในฟิลด์หลัก
    if ([x.C, x.E, x.H, x.I, x.Q, x.EO, x.EP, x.EQ, x.ER, x.ES]
      .some(v => String(v == null ? '' : v).trim() !== '')) {
      data.push(x);
    }
  }

  return {
    ok: true,
    updatedAt: formatUpdatedAt_(),
    rowCount: data.length,
    data: data
  };
}

function normalize_(v) {
  const s = String(v == null ? '' : v).trim();
  if (s === '') return null;

  const clean = s.replace(/,/g, '');
  return /^-?\d+(?:\.\d+)?$/.test(clean) ? Number(clean) : s;
}

function readCache_() {
  try {
    const raw = CacheService.getScriptCache().get(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function writeCache_(payload) {
  try {
    const raw = JSON.stringify(payload);
    CacheService.getScriptCache().put(CACHE_KEY, raw, CACHE_SECONDS);
  } catch (err) {
    // Cache อาจเกินขนาดที่ Google กำหนดไว้ จึงปล่อยให้ระบบทำงานต่อโดยไม่ใช้ cache
  }
}

function clearTWP71Cache() {
  CacheService.getScriptCache().remove(CACHE_KEY);
}

function testConnection() {
  const result = getData_();
  Logger.log('เชื่อมต่อสำเร็จ: %s แถว', result.rowCount);
  Logger.log('อัปเดต: %s', result.updatedAt);
  return result.rowCount;
}

function formatUpdatedAt_() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'Asia/Bangkok',
    'd MMM yyyy HH:mm น.'
  );
}
