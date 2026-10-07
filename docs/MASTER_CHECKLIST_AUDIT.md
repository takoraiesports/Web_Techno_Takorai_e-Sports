# Techno Takorai E-Sports Club — Master Checklist Audit

ตรวจจาก source code ใน repository เมื่อ 2026-10-06 สถานะนี้แยก **มีโครง/หน้า UI** ออกจาก **ฟังก์ชันที่ใช้ได้จริง** และไม่ถือว่าการมี model หรือ mock data เท่ากับระบบเสร็จ

## สรุปสถานะตามหมวด

| # | หมวด | สถานะ | สิ่งที่มีจริง / ช่องว่างหลัก |
|---|---|---|---|
| 1 | User & University Identity | บางส่วน | สมัครด้วยอีเมล/username/ชื่อ; มี StudentVerification model แบบพื้นฐาน. ยังไม่มี Student ID flow, faculty/year/status ครบ, university-domain verification, profile edit หรือ SSO |
| 2 | Authentication & RBAC | บางส่วน | bcrypt, JWT, roles relation; เพิ่ม default STUDENT และ route guards ในงานนี้. ยังไม่มี permission model/role-management UI, token revocation/refresh หรือ server-side role lookup หลังออก token |
| 3 | Game Management | บางส่วน | Game model และ public list/create. ตอนนี้ create ถูกจำกัด Admin; ยังไม่มี edit/delete, game-specific player profile/team enforcement หรือ admin UI |
| 4 | Team Management | บางส่วน | Team + TeamMember models, create/list. ยังไม่มี invitations, roster role validation, captain dashboard/history/remove member |
| 5 | Player E-Sports Profile | บางส่วน | GamerProfile fields แบบย่อ. ไม่มี match-derived statistics, rankings, achievements หรือ history; ยังไม่ทำสถิติที่แก้เองไม่ได้ |
| 6 | Tournament Engine | ยังไม่พร้อม | Tournament model/list/detail พื้นฐาน. ไม่มี organizer CRUD, registration workflow, check-in, approval, cancellation หรือ rules/prize/banner flow ครบ |
| 7 | Tournament Formats | ยังไม่มี engine | มี field format เป็น string; ไม่มี generator/advancement logic สำหรับ Single/Double/RR/Swiss/Two Stage |
| 8 | Two Stage | ยังไม่มี | ไม่มี stage/group/qualification models หรือ flow |
| 9 | Registration | โครงบางส่วน | TournamentRegistration มีทีม/seed/status แต่ยังไม่มี endpoint/validation/approval/withdraw/check-in |
| 10 | Seeding | ยังไม่มี | มีช่อง Seed เท่านั้น; ไม่มี random/manual/ranking/previous/rating seeding หรือ lock |
| 11 | Dynamic Bracket | ยังไม่มี | Match model มี round/number แต่ไม่มี bracket nodes/connections/byes/advancement engine |
| 12 | Match Management | บางส่วน | Match model และ score endpoint; ไม่มี BO validation/schedule/check-in/stream/VOD/forfeit workflow |
| 13 | Match Result | บางส่วน | score/status/winner persistence และ WebSocket broadcast. เพิ่ม validation คะแนน/ผลในงานนี้; ไม่มี evidence, organizer approval/rejection/history |
| 14 | Disputes | ยังไม่มี | ไม่มี dispute model, API หรือ review flow |
| 15 | Statistics & Ranking | ยังไม่มี | ไม่มี player/team stats, rating/Elo หรือ ranking history |
| 16 | Live Stream & VOD | ยังไม่มี | ไม่มี stream/VOD model, embed หรือ schedule UI |
| 17 | News / CMS | ยังไม่มี | ไม่มี content models/API/editor |
| 18 | Merchandise | UI demo | หน้า storefront และ sample products/cart ใน browser; ไม่มี catalog API, SKU/variants/inventory หรือ reserved stock |
| 19 | Order & Payment | ยังไม่มี | ไม่มี order/payment/pickup/shipping/refund. หน้า demo ไม่รับเงินจริงและไม่เก็บข้อมูลบัตร |
| 20 | Notification | ยังไม่มี | ไม่มี notification persistence/center/unread actions |
| 21 | Discord | ยังไม่มี | ไม่มี webhook integration/config flow |
| 22 | Media Storage | โครงบางส่วน | S3 uploader มี; ยังไม่มี metadata/object-key lifecycle และ ownership/type/size restrictions ที่เชื่อมทุก feature |
| 23 | Audit Log | ยังไม่มี | ไม่มี audit model หรือ event logging |
| 24 | Admin Dashboard | ยังไม่มี | ไม่มี dashboard/admin CRUD |
| 25 | Captain Dashboard | ยังไม่มี | ไม่มี dashboard; มีหน้า public team list เท่านั้น |
| 26 | Organizer Dashboard | ยังไม่มี | ไม่มี dashboard/workflow |
| 27 | Public Website | บางส่วน | มี Home/Community/Login/Teams/Tournaments/Details; Live/Schedule/Players/News/Merchandise backend data ยังไม่ครบ |
| 28 | Database Core | ยังไม่ครบ | AutoMigrate ครอบคลุม User/Role/Verification/Profile/Game/Team/Tournament/Registration/Match เท่านั้น; ไม่มี entities ส่วนใหญ่ใน checklist |
| 29 | Architecture | โครงบางส่วน | Next.js/TypeScript, Go/Gin, Postgres, Redis client, S3, WebSocket มีใน scaffold; Redis pub/sub, WebSocket auth/authorization, migrations, CI/CD/monitoring ยังไม่ครบ |
| 30 | Critical Features | ยังไม่พร้อม production | Identity/RBAC พื้นฐานดีขึ้น; Tournament Engine, bracket, check-in, evidence/dispute, ranking, notifications/audit ยังขาด |

## การแก้ไขรอบนี้

- บัญชีที่สมัครใหม่ได้รับ role `STUDENT`; role ถูกบันทึกใน `user_roles` และแนบใน JWT
- จำกัด `POST /games` สำหรับ `ADMIN`/`SUPER_ADMIN`
- จำกัดการแก้คะแนนสำหรับ `ORGANIZER`/`ADMIN`/`SUPER_ADMIN`; การอัปโหลดไฟล์จำกัดกลุ่มเดียวกัน
- ไม่กลืน database errors ระหว่างตรวจ email/username ซ้ำตอนสมัคร
- ตรวจผลแมตช์: คะแนนติดลบ/ผลเสมอ/ไม่มีผู้ชนะเมื่อจบ/มีผู้ชนะก่อนจบถูกปฏิเสธ และผู้ชนะต้องเป็นหนึ่งในสองทีมพร้อมคะแนนสูงกว่า
- production ปฏิเสธ JWT secret เริ่มต้น/สั้นกว่า 32 ตัวอักษร และปฏิเสธอายุ token ที่ไม่เป็นบวก
- เพิ่ม unit tests สำหรับ middleware role checks, config validation และผลการแข่งขัน

## ข้อจำกัดการตรวจ

- `go vet ./...` ผ่าน
- `npm run typecheck` ผ่าน (Go vet + TypeScript checks)
- `npm run build:frontend` ผ่าน และ build สร้างหน้า storefront/community/login/teams/tournaments
- `go test ./...` เริ่ม compile แพ็กเกจ แต่ Windows Application Control บล็อก `go tool link`; จึงยังยืนยันผล runtime ของ Go tests ไม่ได้ใน environment นี้
- ยังไม่ได้ทดสอบ integration กับ PostgreSQL/Redis/S3 จริง และยังไม่มี browser automation test suite

## ลำดับงานที่ควรทำต่อ

1. ออกแบบ schema/migrations สำหรับ registration, stages/groups, bracket nodes, match evidence/results/disputes และ audit logs
2. สร้าง tournament format engine พร้อม deterministic tests: single elimination, double elimination, round robin, Swiss และ two-stage
3. ทำ registration/check-in/organizer approval และ roster validation ผ่าน API พร้อม authorization ตาม ownership
4. ทำสถิติจากผลที่ organizer อนุมัติเท่านั้น แล้วสร้าง profile/ranking views
5. เชื่อมสินค้า/สต็อก/คำสั่งซื้อ และเลือก payment provider ก่อนเปิด checkout จริง
6. เพิ่ม admin/captain/organizer dashboards, notifications, Discord integration และ hardening ของ upload/WebSocket
