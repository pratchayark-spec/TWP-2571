const SPREADSHEET_ID = ''; // เว้นว่าง หาก Apps Script สร้างจาก Google Sheets โดยตรง
const SHEET_NAME = ''; // เว้นว่างเพื่อใช้ชีตแรก
const HEADER_ROW = 4;
const DATA_COLUMNS = { C:3, E:5, H:8, I:9, J:10, K:11, L:12, Q:17, EO:145, EP:146, EQ:147, ER:148, ES:149 };

function doGet(e){
  const callback=e && e.parameter && e.parameter.callback;
  let payload;
  try{payload=getData_()}catch(err){payload={ok:false,error:String(err && err.message ? err.message : err),data:[]};}
  const json=JSON.stringify(payload);
  if(callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)){return ContentService.createTextOutput(callback+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);}
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
function getData_(){
  const ss=SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if(!ss) throw new Error('ไม่พบไฟล์ Google Sheets กรุณาสร้าง Apps Script จาก Google Sheets หรือใส่ Spreadsheet ID');
  const sheet=SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
  if(!sheet) throw new Error('ไม่พบชีตข้อมูล');
  const lastRow=sheet.getLastRow();
  if(lastRow<=HEADER_ROW) return {ok:true,updatedAt:formatUpdatedAt_(),data:[]};
  const lastCol=Math.max.apply(null,Object.keys(DATA_COLUMNS).map(k=>DATA_COLUMNS[k]));
  const values=sheet.getRange(HEADER_ROW+1,1,lastRow-HEADER_ROW,lastCol).getDisplayValues();
  const data=values.map((row,i)=>{const x={};Object.keys(DATA_COLUMNS).forEach(key=>x[key]=normalize_(row[DATA_COLUMNS[key]-1]));x.row=HEADER_ROW+1+i;return x;}).filter(x=>[x.C,x.E,x.H,x.I,x.Q,x.EO,x.EP,x.EQ,x.ER,x.ES].some(v=>String(v==null?'':v).trim()!==''));
  return {ok:true,updatedAt:formatUpdatedAt_(),data:data};
}
function normalize_(v){const s=String(v==null?'':v).trim();if(s==='')return null;const clean=s.replace(/,/g,'');return /^-?\d+(?:\.\d+)?$/.test(clean)?Number(clean):s;}
function formatUpdatedAt_(){return Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Bangkok','d MMM yyyy HH:mm น.');}
