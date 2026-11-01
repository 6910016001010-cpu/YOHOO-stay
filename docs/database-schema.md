# YOHOO ว่างไหม — Database Schema

ฐานข้อมูล: SQLite (WAL mode, foreign keys เปิดใช้งาน) ผ่าน `node:sqlite`

## ตารางและความสัมพันธ์

```text
users 1 ─── N bookings
users 1 ─── N sessions
room_types 1 ─── N rooms
rooms 1 ─── N room_images
rooms N ─── N amenities  (ผ่าน room_amenities)
rooms 1 ─── N bookings
bookings 1 ─── N payments
bookings 1 ─── N booking_status_history
bookings N ─── 1 users
bookings N ─── 1 rooms
```

| ตาราง | หน้าที่ | คีย์สำคัญ |
|---|---|---|
| `users` | บัญชี guest/admin | `email` UNIQUE, `role` CHECK |
| `sessions` | session ที่ผูกกับ cookie แบบ httpOnly | `user_id` FK, `expires_at` |
| `room_types` | ประเภทห้องสำหรับค้นหา/กรอง | `slug` UNIQUE |
| `rooms` | ห้องพักแต่ละห้อง + ราคา/ความจุ/สถานะ | `code`, `slug` UNIQUE, `type_id` FK |
| `amenities` | สิ่งอำนวยความสะดวก | `slug` UNIQUE |
| `room_amenities` | many-to-many ระหว่างห้องและ amenity | composite PK |
| `room_images` | แกลเลอรีรูปห้อง | `room_id` FK |
| `bookings` | การจอง + snapshot ราคา/ผู้เข้าพัก | `code` UNIQUE, FK users/rooms |
| `payments` | ประวัติชำระเงิน/หลักฐานโอน | `booking_id` FK |
| `booking_status_history` | audit trail ของสถานะ | `booking_id` FK |

## สถานะ

- Booking: `PENDING` → `CONFIRMED` → `CHECKED_IN` → `CHECKED_OUT`
- ทางเลือก: `REJECTED`, `CANCELLED`
- Payment: `UNPAID`, `PENDING_REVIEW`, `PAID`, `FAILED`, `REFUNDED`
- Room: `AVAILABLE`, `MAINTENANCE`, `INACTIVE`

## กติกาสำคัญ

- ตรวจห้องว่างด้วย overlap: `existing.check_in < requested.check_out AND existing.check_out > requested.check_in`
- สถานะที่บล็อกห้อง: `PENDING`, `CONFIRMED`, `CHECKED_IN`
- ราคาคำนวณฝั่ง server: ค่าห้อง × จำนวนคืน + service fee 10% + VAT 7%
- ไม่อนุญาตให้จองวันในอดีต, เกินความจุ, หรือเกิน 30 คืน
- ลบห้องได้เฉพาะห้องที่ยังไม่มีประวัติการจอง มิฉะนั้นให้เปลี่ยนสถานะเป็น `INACTIVE`
