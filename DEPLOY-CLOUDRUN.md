# คู่มือ Deploy เว็บ **ลอยกระทง สระหลวง 3D** ขึ้น Google Cloud Run (สำหรับ Nine)

ไฟล์ทั้งหมดในโปรเจกต์ถูกเตรียมพร้อมสำหรับ Google Cloud Run แล้ว (`Dockerfile`, `.dockerignore`, `/healthz`, Gzip, Adaptive SSE Broadcast, และ Dynamic `og:image` รูปปก `assets/cover.jpg`)

---

## ขั้นที่ 1: เปิดรับเครดิตฟรีจาก Google AI Pro (\$10/เดือน) + ตั้งเตือนกันเกินงบ

1. เข้าไปที่หน้า **Google Developer Program**: https://developers.google.com/program (ล็อกอินด้วยบัญชี Google ที่สมัคร Google AI Pro)
2. กดรับสิทธิ์ **Google Cloud Developer Credits (\$10/month)** และผูกเข้ากับ Billing Account ของคุณใน Google Cloud Console (ระบบจะให้ผูกบัตร/ยืนยันบัญชี Billing ครั้งแรก)
3. ไปที่ **Google Cloud Console** (https://console.cloud.google.com):
   - สร้าง Project ใหม่ เช่น `saluang-loykrathong` (หรือเลือกโปรเจกต์ที่ผูก Billing แล้ว)
   - แนะนำตั้ง **Billing → Budgets & alerts** แจ้งเตือนที่ `\$5` และ `\$9` เพื่อคุมให้อยู่ในเครดิตฟรีเสมอ

---

## ขั้นที่ 2: นำโค้ดขึ้น Google Cloud

สามารถทำได้ **2 วิธี** (เลือกวิธีที่ Nine ถนัดที่สุด):

### วิธี A: ผ่าน GitHub (แนะนำ — แก้โค้ดแล้วอัปเดตง่าย)
1. ในเครื่อง Nine ให้ล็อกอิน GitHub ก่อน (ครั้งเดียว):
   ```powershell
   gh auth login
   ```
2. จากนั้นสร้าง Repo ใหม่และ Push โค้ดขึ้น GitHub:
   ```powershell
   cd C:\Users\Bananait\Downloads\HoiTod-Toto-SaLuang-3D
   git init
   git branch -M main
   git add .
   git commit -m "Ready for Google Cloud Run with cover artwork"
   gh repo create saluang-loykrathong-3d --public --source=. --push
   ```
3. เปิด **Google Cloud Shell** (ไอคอน `>_` มุมขวาบนของ Google Cloud Console) แล้ว Clone ลงมา:
   ```bash
   git clone https://github.com/<USERNAME_ของ_Nine>/saluang-loykrathong-3d.git
   cd saluang-loykrathong-3d
   ```

### วิธี B: ไม่ใช้ GitHub — อัปโหลดโฟลเดอร์เข้า Cloud Shell ตรงๆ
1. คลิกขวาโฟลเดอร์ `C:\Users\Bananait\Downloads\HoiTod-Toto-SaLuang-3D` → **Compress to ZIP** (บีบอัดเป็นไฟล์ `.zip`)
2. เปิด **Google Cloud Console** → กดไอคอน **`>_` (Cloud Shell)** มุมขวาบน → กดเมนู **`⋮` (More)** → **Upload** เพื่ออัปโหลดไฟล์ `.zip`
3. แตกไฟล์ใน Cloud Shell:
   ```bash
   unzip HoiTod-Toto-SaLuang-3D.zip -d saluang-3d
   cd saluang-3d
   ```

---

## ขั้นที่ 3: สั่ง Deploy ขึ้น Google Cloud Run (โซนสิงคโปร์ `asia-southeast1`)

เปลี่ยน `ADMIN_KEY=<ตั้งรหัสแอดมินใหม่ที่เดายาก>` แล้วรันคำสั่งเดียวใน **Google Cloud Shell**:

```bash
gcloud config set run/region asia-southeast1

gcloud run deploy saluang-loykrathong \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 \
  --memory 1Gi \
  --concurrency 500 \
  --max-instances 1 \
  --timeout 3600 \
  --set-env-vars "NODE_ENV=production,MAX_SSE_CLIENTS=500,ADMIN_KEY=เปลี่ยนเป็นรหัสแอดมินลับของNine"
```

> **ทำไมถึงแนะนำ `--max-instances 1` และ `--concurrency 500`?**
> เพราะระบบออนไลน์แบบ SSE เก็บรายชื่อคนที่เดินอยู่ในสระเดียวกันไว้ในหน่วยความจำของเซิร์ฟเวอร์ การให้ทุกคนเข้ามาอยู่ในเครื่องเดียวที่สเปก `1 vCPU / 1Gi RAM` รองรับคนเดินพร้อมกันได้ถึง ~**500 คน** โดยทุกคนเห็นหน้ากันครบในสระเดียวกัน!

*(เสริม: หากต้องการให้เซิร์ฟเวอร์ **ไม่หลับเลย** และมีคนเข้าเล่นตลอดเวลา สามารถเพิ่ม `--min-instances 1` เข้าไปได้ โดยใช้เครดิต Google AI Pro ช่วยจ่าย)*

---

## ขั้นที่ 4 (ตัวเลือกเสริม): กันกระทงและสถิติหายเมื่อ Deploy ใหม่หรือเครื่องรีสตาร์ท

โดยปกติ Cloud Run เป็นระบบ Container ชั่วคราว (หากรีสตาร์ท กระทงที่เพิ่งลอยใหม่จะกลับไปเป็นค่าเริ่มต้นใน `krathongs.json`)
ถ้าอยากให้กระทงและสถิติอยู่ถาวรบนคลาวด์ด้วย **Google Cloud Storage (Free Tier 5GB)**:

1. สร้าง Bucket ในสิงคโปร์ (ชื่อห้ามซ้ำใครทั่วโลก):
   ```bash
   gcloud storage buckets create gs://saluang-krathong-data-$RANDOM \
     --location=asia-southeast1 \
     --uniform-bucket-access-only
   ```
   *(จำชื่อ Bucket ที่ได้ไว้ เช่น `saluang-krathong-data-12345`)*
2. อัปเดต Cloud Run ให้ Mount ถังข้อมูลนี้ไว้ที่ `/data`:
   ```bash
   gcloud run services update saluang-loykrathong \
     --region asia-southeast1 \
     --execution-environment gen2 \
     --add-volume name=krathong-vol,type=cloud-storage,bucket=ใส่ชื่อ_BUCKET_ที่ได้ \
     --add-volume-mount volume=krathong-vol,mount-path=/data \
     --update-env-vars "DATA_DIR=/data"
   ```

---

## ขั้นที่ 5: ตรวจสอบหลัง Deploy เสร็จ

เมื่อคำสั่ง Deploy จบ จะได้ URL จริง เช่น `https://saluang-loykrathong-xxxxx-as.a.run.app`

1. ทดสอบเปิด **`https://<URL>/healthz`** → ต้องขึ้น `"ok": true`
2. ทดสอบแชร์ลิงก์เข้า **LINE** หรือ **Facebook Sharing Debugger** → จะเห็น **รูปปก "ลอยกระทง สระหลวง อำเภอหนองไผ่"** เด้งขึ้นมาสวยงามอัตโนมัติ
3. หน้าแอดมินเข้าได้ที่ **`https://<URL>/admin.html`** (ใส่รหัส `ADMIN_KEY` ที่ Nine ตั้งไว้)
