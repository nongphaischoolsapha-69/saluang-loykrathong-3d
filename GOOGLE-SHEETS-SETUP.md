# คู่มือเชื่อมต่อ Google Sheets สำรองข้อมูลผู้เข้าเล่น & กระทงถาวร (ฟรี 100%)

เมื่อตั้งค่าตามขั้นตอนนี้แล้ว เว็บ **ลอยกระทง สระหลวง 3D** จะส่งข้อมูลทุกครั้งที่มีคนเข้าเล่น เปลี่ยนชื่อ หรือปล่อยกระทง ไปบันทึกไว้ใน Google Sheets ของ Nine อัตโนมัติ (ไม่หายแม้ Render Free จะหลับหรือรีสตาร์ท)

---

## ขั้นตอนที่ 1: สร้าง Google Sheet และวางสคริปต์

1. เปิด [Google Sheets](https://sheets.google.com) สร้างสเปรดชีตใหม่ ตั้งชื่อว่า **`สถิติลอยกระทง สระหลวง 3D`**
2. กดเมนูด้านบน: **ส่วนขยาย (Extensions)** → **Apps Script**
3. ลบโค้ดเดิมทั้งหมดใน `Code.gs` แล้วคัดลอกโค้ดด้านล่างนี้ไปวาง:

```javascript
// (ไม่บังคับ) ถ้าตั้ง SHEETS_SECRET ใน Render ให้แก้ให้ตรงกัน หรือเว้น '' ไว้ได้
const EXPECTED_SECRET = '';

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (EXPECTED_SECRET && data.secret !== EXPECTED_SECRET) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Forbidden' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tz = 'Asia/Bangkok';
    const timeStr = Utilities.formatDate(new Date(data.ts || Date.now()), tz, 'yyyy-MM-dd HH:mm:ss');
    const ev = String(data.event || '');

    if (ev === 'visit' || ev === 'name_update') {
      let sh = ss.getSheetByName('ผู้เข้าเล่น');
      if (!sh) {
        sh = ss.insertSheet('ผู้เข้าเล่น');
        sh.appendRow(['เวลาล่าสุด (ไทย)', 'ประเภท', 'ชื่อผู้เล่น', 'อุปกรณ์', 'ชุด', 'จำนวนครั้งเข้าเล่น', 'จำนวนกระทง', 'IP', 'รหัสเครื่อง']);
      }
      const key = String(data.visitorKey || '');
      const rowData = [
        timeStr,
        ev === 'name_update' ? 'เปลี่ยนชื่อ' : 'เข้าเล่น',
        data.name || '',
        data.deviceType || '',
        data.outfit || '',
        Number(data.visits) || 1,
        Number(data.krathongsCount) || 0,
        data.ip || '',
        key
      ];

      // ถ้าพบรหัสเครื่องเดิมล่าสุด ให้อัปเดตแถวเดิมเพื่อไม่ให้รกตอนเปลี่ยนชื่อ
      if (key && ev === 'name_update') {
        const lastRow = sh.getLastRow();
        const keys = lastRow > 1 ? sh.getRange(2, 9, lastRow - 1, 1).getValues() : [];
        for (let i = keys.length - 1; i >= 0; i--) {
          if (String(keys[i][0]) === key) {
            sh.getRange(i + 2, 1, 1, rowData.length).setValues([rowData]);
            return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      sh.appendRow(rowData);
    } else if (ev === 'krathong') {
      let sh = ss.getSheetByName('กระทงที่ลอย');
      if (!sh) {
        sh = ss.insertSheet('กระทงที่ลอย');
        sh.appendRow(['เวลาที่ลอย (ไทย)', 'ชื่อผู้ลอย', 'คำอธิษฐาน', 'ฐาน', 'ดอกไม้', 'สีเทียน', 'ของมงคล', 'กระทงทองคำ', 'ยอดรวมสะสม', 'รหัสเครื่อง']);
      }
      sh.appendRow([
        timeStr,
        data.name || '',
        data.wish || '',
        data.baseId || '',
        data.flowerId || '',
        data.candleId || '',
        data.toppingId || '',
        data.isVip ? 'ใช่' : 'ไม่',
        Number(data.totalKrathongsAllTime) || 0,
        data.visitorKey || ''
      ]);
    } else if (ev === 'test') {
      let sh = ss.getSheetByName('ผู้เข้าเล่น');
      if (!sh) {
        sh = ss.insertSheet('ผู้เข้าเล่น');
        sh.appendRow(['เวลาล่าสุด (ไทย)', 'ประเภท', 'ชื่อผู้เล่น', 'อุปกรณ์', 'ชุด', 'จำนวนครั้งเข้าเล่น', 'จำนวนกระทง', 'IP', 'รหัสเครื่อง']);
      }
      sh.appendRow([timeStr, 'TEST', data.name || 'Admin Test', 'Server', '-', 0, 0, '-', data.note || 'OK']);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## ขั้นตอนที่ 2: Deploy เป็น Web App เพื่อรับลิงก์ Webhook

1. กดปุ่ม **Deploy (ทำให้ใช้งานได้)** มุมขวาบน → **New deployment (การทำให้ใช้งานได้รายการใหม่)**
2. ช่องรูปฟันเฟืองเลือกประเภทเป็น **Web app (เว็บแอป)**
3. ตั้งค่า:
   - **Execute as (ดำเนินการในฐานะ):** `Me` (บัญชีของ Nine)
   - **Who has access (ผู้ที่มีสิทธิ์เข้าถึง):** `Anyone` (ทุกคน)
4. กด **Deploy** → กดยืนยันสิทธิ์ (Authorize access) → คัดลอกลิงก์ **Web app URL** (`https://script.google.com/macros/s/.../exec`)

---

## ขั้นตอนที่ 3: นำลิงก์มาวางใน Render & ทดสอบ

1. เปิด **Render Dashboard** → เว็บเซอร์วิส `saluang-loykrathong-3d` → แท็บ **Environment**
2. เพิ่มตัวแปรใหม่:
   - Key: `SHEETS_WEBHOOK_URL`
   - Value: ลิงก์ `https://script.google.com/macros/s/.../exec` ที่คัดลอกมา
   - *(ถ้าต้องการ)* เพิ่ม `ADMIN_KEY` เป็นรหัสลับสำหรับหน้า `/admin.html` ด้วย
3. กด **Save, rebuild, and deploy**
4. เข้า `/admin.html` → กดปุ่ม **"ทดสอบส่งเข้า Google Sheets"** แล้วดูใน Google Sheets ได้ทันทีครับ!
