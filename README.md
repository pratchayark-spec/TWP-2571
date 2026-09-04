# TWP 71 — ระบบติดตามบันทึกแผนปฏิบัติการด้านทรัพยากรน้ำ ประจำปี 2571 จังหวัดจันทบุรี 

รุ่นนี้เชื่อม Google Sheets ตาม URL ที่กำหนดใน `index.html` และมีข้อมูลสำรองใน `data.js`

## Apps Script
เปิด Google Sheets → ส่วนขยาย → Apps Script แล้วใช้ `Code.gs`
- หากสร้าง Apps Script จากไฟล์ Google Sheets โดยตรง ให้ `SPREADSHEET_ID` ว่าง
- หากเป็นโปรเจกต์แยก ให้ใส่ Spreadsheet ID
- `SHEET_NAME` เว้นว่างเพื่อใช้ชีตแรก
- Deploy → New deployment → Web app → Execute as Me → Who has access: Anyone

หน้าเว็บจะดึงข้อมูลล่าสุดเมื่อเปิดหน้าเว็บ และตรวจซ้ำทุก 5 นาที พร้อมปุ่มอัปเดตทันที
