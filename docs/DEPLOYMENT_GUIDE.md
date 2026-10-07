# คู่มือ Deploy Techno Takorai E-Sports Club

เว็บไซต์แบ่งเป็น Next.js frontend และ Go API แยกกัน หน้าเว็บที่ Vercel ต้องเรียก Go API ที่เปิดผ่าน HTTPS ได้ ห้ามใช้ `localhost` เป็น API URL ใน production

## ตั้งค่า Frontend บน Vercel

ตั้ง Environment Variable ใน Vercel Project:

```env
NEXT_PUBLIC_API_URL=https://<โดเมน-public-ของ-go-api>
```

ใส่เฉพาะ origin ของ API เช่น `https://api.example.org` ไม่ต้องต่อ `/api/v1` จากนั้น Redeploy frontend เพราะ Next.js ฝังค่านี้ตอน Build

## ตั้งค่า Backend

ตั้ง Environment Variables ในเครื่องหรือบริการที่รัน Go API:

```env
ENV=production
FRONTEND_URL=https://ttes-club.vercel.app
FRONTEND_URLS=https://ttes-club.vercel.app
DB_HOST=<postgres-host>
DB_PORT=<postgres-port>
DB_USER=<postgres-user>
DB_PASSWORD=<secret>
DB_NAME=<database-name>
DB_SSLMODE=require
REDIS_HOST=<redis-host>
REDIS_PORT=<redis-port>
REDIS_PASSWORD=<secret>
JWT_SECRET=<random-secret-at-least-32-characters>
S3_ENDPOINT=<s3-or-minio-endpoint>
S3_REGION=<region>
S3_ACCESS_KEY=<access-key>
S3_SECRET_KEY=<secret-key>
S3_BUCKET_NAME=<bucket-name>
```

`FRONTEND_URLS` รับหลาย origin โดยคั่นด้วย comma และอนุญาตเฉพาะ HTTPS origins ที่ระบุเท่านั้น เพิ่มโดเมน production/preview ที่ต้องการให้เรียก API อย่างชัดเจน

PostgreSQL ใช้ Supabase ได้ โดยตั้งค่าการเชื่อมต่อแยกเป็น `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` และ `DB_SSLMODE` ตามหน้า Database Settings ของ Supabase ตัว Go API จะสร้าง/ปรับ schema และเติมแคตตาล็อกเกมเมื่อเริ่มทำงาน ไม่ต้องนำ `DATABASE_URL` ไปใส่ใน frontend

Redis และ S3-compatible storage เป็น dependencies ของ backend ใน production ใช้ Compose profile ตาม `docker/docker-compose.production.yml` หรือบริการ managed ที่ตั้งค่า network และ credentials ให้ backend เข้าถึงได้

## ตรวจหลัง Deploy

1. เปิด `https://<โดเมน-api>/health` ต้องได้สถานะพร้อมใช้งาน
2. เรียก `https://<โดเมน-api>/api/v1/games` ต้องได้ข้อมูลเกม
3. เปิดหน้าร้านและหน้าสร้างทัวร์นาเมนต์จากโดเมน Vercel ตรวจว่าไม่มี request ไป `localhost` และไม่มี CORS error
4. ถ้ายังเชื่อมต่อไม่ได้ ตรวจค่า `NEXT_PUBLIC_API_URL` ที่ Vercel, origin ใน `FRONTEND_URLS` ของ backend และ Redeploy frontend หลังเปลี่ยน environment variables

## Cloudinary

Cloudinary unsigned upload ใช้ Cloud Name และ Upload Preset ที่อนุญาตให้ใช้จาก client ได้เท่านั้น ห้ามฝัง API Secret หรือ credentials ฝั่ง server ลงใน `NEXT_PUBLIC_*` หรือไฟล์ตัวอย่างที่ commit เข้า repository
