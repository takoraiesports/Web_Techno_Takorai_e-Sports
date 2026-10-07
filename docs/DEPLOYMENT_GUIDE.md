# 🚀 คู่มือการ Deploy Web Techno Takorai e-Sports (Vercel + Supabase + Cloudinary)

ระบบได้รับการออกแบบให้รองรับการแยกส่วนบริการ (Cloud Services) ดังนี้:

---

## 1. 🗄️ 1. ฝากฐานข้อมูลไว้กับ Supabase (PostgreSQL)

### ขั้นตอนการตั้งค่า:
1. สมัคร/เข้าสู่ระบบ [Supabase.com](https://supabase.com) แล้วสร้าง **New Project**
2. ไปที่ **Project Settings** -> **Database** แล้วคัดลอก **Connection String** (URI Mode หรือ Transaction Pooler):
   ```env
   DATABASE_URL="postgres://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
   ```
3. นำ SQL Schema สคริปต์ไปรันใน **SQL Editor** ของ Supabase เพื่อสร้างตารางทั้งหมด (Users, Tournaments, Teams, Products, News, Orders, MatchBrackets)

---

## 2. 🖼️ 2. ฝากรูปภาพไว้กับ Cloudinary (Image Storage)

### ขั้นตอนการตั้งค่า:
1. สมัคร/เข้าสู่ระบบ [Cloudinary.com](https://cloudinary.com)
2. ไปที่ **Dashboard** คัดลอกค่า:
   - `Cloud Name`
   - `API Key`
   - `API Secret`
3. ไปที่ **Settings** -> **Upload** -> **Upload presets** -> เพิ่ม Preset ใหม่
   - ตั้งชื่อ Preset เช่น `takorai_uploads`
   - กำหนด Mode เป็น `Unsigned` (เพื่อให้ Frontend อัปโหลดรูปภาพได้สะดวก)

### Environment Variables ที่ต้องตั้งค่าใน Next.js:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="takorai_uploads"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

---

## 3. 🌐 3. Deploy บน Vercel (Frontend & Next.js App)

### ขั้นตอนการเชื่อมต่อ GitHub กับ Vercel:
1. ไปที่ [Vercel.com](https://vercel.com) แล้วกด **Add New...** -> **Project**
2. เลือก Import Repository `takoraiesports/Web_Techno_Takorai_e-Sports`
3. ตั้งค่า **Project Configuration**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. ตั้งค่า **Environment Variables** บน Vercel Dashboard:
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = `your-cloud-name`
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` = `takorai_uploads`
   - `DATABASE_URL` = `postgres://...`
5. กด **Deploy** 🚀
