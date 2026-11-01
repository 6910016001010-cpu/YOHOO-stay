import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { hashPassword } from "./password";
import { addDays, diffDays, todayISO } from "./date";
import { calculatePrice } from "./money";

const DB_PATH = process.env.DATABASE_PATH ?? join(process.cwd(), "data", "yohoo.db");

declare global {
  // eslint-disable-next-line no-var
  var __yohooDb: DatabaseSync | undefined;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'GUEST' CHECK (role IN ('GUEST','ADMIN')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS room_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type_id TEXT NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  price_per_night INTEGER NOT NULL CHECK (price_per_night > 0),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  size_sqm INTEGER NOT NULL DEFAULT 0,
  bed_type TEXT NOT NULL DEFAULT 'King',
  floor TEXT NOT NULL DEFAULT '1',
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','MAINTENANCE','INACTIVE')),
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type_id);

CREATE TABLE IF NOT EXISTS amenities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS room_amenities (
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  amenity_id TEXT NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (room_id, amenity_id)
);

CREATE TABLE IF NOT EXISTS room_images (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_room_images_room ON room_images(room_id, sort_order);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  guests INTEGER NOT NULL CHECK (guests > 0),
  nights INTEGER NOT NULL CHECK (nights > 0),
  room_rate INTEGER NOT NULL CHECK (room_rate > 0),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  service_fee INTEGER NOT NULL CHECK (service_fee >= 0),
  tax INTEGER NOT NULL CHECK (tax >= 0),
  total INTEGER NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONFIRMED','CHECKED_IN','CHECKED_OUT','CANCELLED','REJECTED')),
  payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID','PENDING_REVIEW','PAID','FAILED','REFUNDED')),
  special_requests TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  cancelled_at TEXT,
  cancel_reason TEXT,
  checked_in_at TEXT,
  checked_out_at TEXT,
  CHECK (check_out > check_in)
);
CREATE INDEX IF NOT EXISTS idx_bookings_room_dates ON bookings(room_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('CARD','BANK_TRANSFER')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','FAILED','REFUNDED')),
  reference TEXT NOT NULL,
  slip_url TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE TABLE IF NOT EXISTS booking_status_history (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  changed_by TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_booking_history ON booking_status_history(booking_id, created_at);
`;

interface SeedRoom {
  id: string;
  code: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  price: number;
  capacity: number;
  size: number;
  bed: string;
  floor: string;
  featured: number;
  cover: string;
  images: string[];
  amenities: string[];
}

function seedDatabase(db: DatabaseSync) {
  const userCount = Number((db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n);
  if (userCount > 0) return;

  const now = new Date().toISOString();
  const today = todayISO();

  const insertUser = db.prepare(
    "INSERT INTO users (id, name, email, phone, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const adminId = "usr_admin_yohoo";
  const guestId = "usr_guest_demo";
  insertUser.run(adminId, "ผู้จัดการ ยุฮู", "admin@yohoo.co", "081-234-5678", hashPassword("Admin123!"), "ADMIN", now, now);
  insertUser.run(guestId, "ภูเขา ว่างดี", "guest@yohoo.co", "089-876-5432", hashPassword("Guest123!"), "GUEST", now, now);
  insertUser.run("usr_nicha", "ณิชา ใจดี", "nicha@example.com", "086-111-2233", hashPassword("Test1234!"), "GUEST", now, now);

  const types = [
    ["type_standard", "สแตนดาร์ด", "standard", "ห้องพักเรียบง่าย ครบครัน สำหรับการพักผ่อนสายสั้น"],
    ["type_deluxe", "ดีลักซ์", "deluxe", "ห้องกว้างขวางพร้อมวิวสวนเขียวและพื้นที่พักผ่อนเต็มรูปแบบ"],
    ["type_premier", "พรีเมียร์", "premier", "ห้องมุมวิวทะเล ระเบียงส่วนตัว และบรรยากาศเงียบสงบ"],
    ["type_family", "แฟมิลี่", "family", "สวีทสำหรับครอบครัว มีพื้นที่แยกสำหรับเด็ก"],
    ["type_villa", "วิลล่า", "villa", "วิลล่าส่วนตัวพร้อมสวนและอ่างจากุซซี่กลางแจ้ง"],
    ["type_honeymoon", "ฮันนีมูน", "honeymoon", "ห้องโรแมนติกสำหรับคู่รัก วิวพระอาทิตย์ตก"],
  ];
  const insertType = db.prepare("INSERT INTO room_types (id, name, slug, description) VALUES (?, ?, ?, ?)");
  for (const row of types) insertType.run(...row);

  const amenities = [
    ["amn_wifi", "Wi-Fi ความเร็วสูง", "wifi", "wifi"],
    ["amn_ac", "เครื่องปรับอากาศ", "air-conditioning", "snowflake"],
    ["amn_tv", "สมาร์ททีวี", "smart-tv", "tv"],
    ["amn_breakfast", "อาหารเช้า", "breakfast", "coffee"],
    ["amn_pool", "สระว่ายน้ำ", "pool", "waves"],
    ["amn_parking", "ที่จอดรถ", "parking", "car"],
    ["amn_bathtub", "อ่างอาบน้ำ", "bathtub", "bath"],
    ["amn_minibar", "มินิบาร์", "minibar", "utensils"],
    ["amn_workspace", "โต๊ะทำงาน", "workspace", "briefcase"],
    ["amn_seaview", "วิวทะเล", "sea-view", "sun"],
  ];
  const insertAmenity = db.prepare("INSERT INTO amenities (id, name, slug, icon) VALUES (?, ?, ?, ?)");
  for (const row of amenities) insertAmenity.run(...row);

  const rooms: SeedRoom[] = [
    {
      id: "room_dlx_101",
      code: "DLX-101",
      name: "ดีลักซ์ สวนเขียว",
      slug: "deluxe-garden",
      type: "type_deluxe",
      description:
        "ห้องดีลักซ์มุมสวนที่ออกแบบด้วยโทนไม้ธรรมชาติและแสงธรรมชาติทั้งวัน เตียง킹ไซซ์นุ่มสบาย พร้อมระเบียงส่วนตัวที่มองเห็นสวนเขียวของโรงแรม เหมาะสำหรับคู่รักที่ต้องการหลีกหนีความวุ่นวายและพักผ่อนอย่างเต็มที่",
      price: 3200,
      capacity: 2,
      size: 32,
      bed: "King Size",
      floor: "1",
      featured: 1,
      cover: "/images/room-deluxe.webp",
      images: ["/images/room-deluxe.webp", "/images/room-detail-1.webp", "/images/breakfast.webp"],
      amenities: ["amn_wifi", "amn_ac", "amn_tv", "amn_breakfast", "amn_pool", "amn_parking", "amn_workspace"],
    },
    {
      id: "room_prm_201",
      code: "PRM-201",
      name: "พรีเมียร์ วิวทะเล",
      slug: "premier-ocean",
      type: "type_premier",
      description:
        "ตื่นมาพร้อมแสงเช้าที่สะท้อนผิวทะเลจากระเบียงส่วนตัว ห้องพรีเมียร์มีพื้นที่นั่งเล่นแยก งานศิลปะท้องถิ่น และเตียงนอนคุณภาพสูง ห้องกว้าง 42 ตร.ม. พร้อมอ่างอาบน้ำที่มองเห็นวิวทะเล เหมาะกับวันพักผ่อนที่ต้องการความพิเศษ",
      price: 4800,
      capacity: 2,
      size: 42,
      bed: "King Size",
      floor: "2",
      featured: 1,
      cover: "/images/room-premier.webp",
      images: ["/images/room-premier.webp", "/images/room-detail-2.webp", "/images/poolside.webp"],
      amenities: ["amn_wifi", "amn_ac", "amn_tv", "amn_breakfast", "amn_pool", "amn_parking", "amn_bathtub", "amn_seaview"],
    },
    {
      id: "room_fam_301",
      code: "FAM-301",
      name: "แฟมิลี่ สวีท",
      slug: "family-suite",
      type: "type_family",
      description:
        "สวีทกว้าง 58 ตร.ม. ออกแบบมาเพื่อครอบครัวโดยเฉพาะ มีห้องนอนหลักพร้อมเตียงคิงและโซนเด็กที่มีเตียงเสริมสองเตียง พื้นที่นั่งเล่นกว้างขวาง มินิบาร์ และห้องน้ำสองห้อง ช่วยให้ทุกคนมีพื้นที่ส่วนตัวและใช้เวลาร่วมกันได้อย่างสบาย",
      price: 6500,
      capacity: 4,
      size: 58,
      bed: "King + 2 Single",
      floor: "3",
      featured: 1,
      cover: "/images/room-family.webp",
      images: ["/images/room-family.webp", "/images/room-detail-1.webp", "/images/lobby.webp"],
      amenities: [
        "amn_wifi",
        "amn_ac",
        "amn_tv",
        "amn_breakfast",
        "amn_pool",
        "amn_parking",
        "amn_minibar",
        "amn_workspace",
      ],
    },
    {
      id: "room_vil_001",
      code: "VIL-001",
      name: "เดอะ การ์เดน วิลล่า",
      slug: "garden-villa",
      type: "type_villa",
      description:
        "วิลล่าส่วนตัวหนึ่งหลังในสวนเขตร้อน พร้อมสระว่ายน้ำส่วนตัว อ่างจากุซซี่กลางแจ้ง และพื้นที่รับประทานอาหารกลางสวน ภายในตกแต่งด้วยวัสดุธรรมชาติและงานคราฟต์จากช่างท้องถิ่น เหมาะสำหรับการพักผ่อนหลายคืนหรือโอกาสพิเศษ",
      price: 8900,
      capacity: 4,
      size: 75,
      bed: "King + Sofa Bed",
      floor: "Ground",
      featured: 1,
      cover: "/images/room-villa.webp",
      images: ["/images/room-villa.webp", "/images/poolside.webp", "/images/resort.webp"],
      amenities: ["amn_wifi", "amn_ac", "amn_tv", "amn_breakfast", "amn_pool", "amn_parking", "amn_bathtub", "amn_minibar"],
    },
    {
      id: "room_std_102",
      code: "STD-102",
      name: "สมาร์ท สแตนดาร์ด",
      slug: "smart-standard",
      type: "type_standard",
      description:
        "ห้องสแตนดาร์ดที่ออกแบบอย่างชาญฉลาด ใช้พื้นที่ทุกตารางเมตรให้เกิดประโยชน์ พร้อมเตียงควีนที่นอนสบาย โต๊ะทำงาน และห้องน้ำฝักบัวสายฝน เหมาะสำหรับผู้เดินทางคนเดียวหรือคู่รักที่ต้องการที่พักคุณภาพในราคาที่เข้าถึงได้",
      price: 1800,
      capacity: 2,
      size: 24,
      bed: "Queen Size",
      floor: "1",
      featured: 0,
      cover: "/images/room-standard.webp",
      images: ["/images/room-standard.webp", "/images/room-detail-2.webp", "/images/breakfast.webp"],
      amenities: ["amn_wifi", "amn_ac", "amn_tv", "amn_parking", "amn_workspace"],
    },
    {
      id: "room_hon_401",
      code: "HON-401",
      name: "ฮันนีมูน วิวพระอาทิตย์ตก",
      slug: "honeymoon-sunset",
      type: "type_honeymoon",
      description:
        "ห้องมุมชั้นบนที่เปิดรับวิวพระอาทิตย์ตกแบบไม่มีสิ่งกีดขวาง เตียงกลมขนาดใหญ่ ห้องน้ำหินอ่อนพร้อมอ่างจากุซซี่ และบริการ sparkling wine ต้อนรับยามเย็น ทำให้ทุกช่วงเวลาของการฮันนีมูนเป็นความทรงจำที่ยากจะลืม",
      price: 5600,
      capacity: 2,
      size: 45,
      bed: "Round King",
      floor: "4",
      featured: 1,
      cover: "/images/room-honeymoon.webp",
      images: ["/images/room-honeymoon.webp", "/images/room-detail-1.webp", "/images/hero-resort.webp"],
      amenities: ["amn_wifi", "amn_ac", "amn_tv", "amn_breakfast", "amn_pool", "amn_bathtub", "amn_minibar", "amn_seaview"],
    },
  ];

  const insertRoom = db.prepare(`
    INSERT INTO rooms (id, code, name, slug, type_id, description, price_per_night, capacity, size_sqm, bed_type, floor, status, featured, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', ?, ?, ?)
  `);
  const insertImage = db.prepare(
    "INSERT INTO room_images (id, room_id, url, alt, sort_order) VALUES (?, ?, ?, ?, ?)",
  );
  const insertRoomAmenity = db.prepare("INSERT INTO room_amenities (room_id, amenity_id) VALUES (?, ?)");

  for (const room of rooms) {
    insertRoom.run(
      room.id,
      room.code,
      room.name,
      room.slug,
      room.type,
      room.description,
      room.price,
      room.capacity,
      room.size,
      room.bed,
      room.floor,
      room.featured,
      now,
      now,
    );
    room.images.forEach((url, index) => {
      insertImage.run(`img_${room.id}_${index}`, room.id, url, `${room.name} — ภาพที่ ${index + 1}`, index);
    });
    for (const amenityId of room.amenities) insertRoomAmenity.run(room.id, amenityId);
  }

  const roomMap = new Map(rooms.map((room) => [room.id, room]));
  const insertBooking = db.prepare(`
    INSERT INTO bookings (
      id, code, user_id, room_id, guest_name, guest_email, guest_phone, check_in, check_out,
      guests, nights, room_rate, subtotal, service_fee, tax, total, status, payment_status,
      special_requests, created_at, updated_at, cancelled_at, cancel_reason, checked_in_at, checked_out_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPayment = db.prepare(`
    INSERT INTO payments (id, booking_id, method, amount, status, reference, slip_url, paid_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertHistory = db.prepare(
    "INSERT INTO booking_status_history (id, booking_id, status, note, changed_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );

  let bookingSequence = 0;
  function addBooking(opts: {
    roomId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT";
    paymentStatus: "UNPAID" | "PENDING_REVIEW" | "PAID";
    guestName?: string;
    userId?: string;
    specialRequests?: string;
    paymentMethod?: "CARD" | "BANK_TRANSFER";
  }) {
    const room = roomMap.get(opts.roomId)!;
    const nights = diffDays(opts.checkIn, opts.checkOut);
    const price = calculatePrice(room.price, nights);
    bookingSequence += 1;
    const id = `seed_booking_${String(bookingSequence).padStart(3, "0")}`;
    const code = `YH-${opts.checkIn.slice(2, 4)}${opts.checkIn.slice(5, 7)}-${String(1000 + bookingSequence)}`;
    const createdAt = new Date(Date.now() - Math.max(2, 14 - bookingSequence) * 86_400_000).toISOString();
    const checkedInAt = opts.status === "CHECKED_IN" || opts.status === "CHECKED_OUT" ? `${opts.checkIn}T07:00:00.000Z` : null;
    const checkedOutAt = opts.status === "CHECKED_OUT" ? `${opts.checkOut}T04:00:00.000Z` : null;
    insertBooking.run(
      id,
      code,
      opts.userId ?? guestId,
      room.id,
      opts.guestName ?? "ภูเขา ว่างดี",
      opts.userId === "usr_nicha" ? "nicha@example.com" : "guest@yohoo.co",
      opts.userId === "usr_nicha" ? "086-111-2233" : "089-876-5432",
      opts.checkIn,
      opts.checkOut,
      opts.guests,
      nights,
      room.price,
      price.subtotal,
      price.serviceFee,
      price.tax,
      price.total,
      opts.status,
      opts.paymentStatus,
      opts.specialRequests ?? null,
      createdAt,
      now,
      null,
      null,
      checkedInAt,
      checkedOutAt,
    );
    insertHistory.run(randomUUID(), id, "PENDING", "สร้างรายการจอง", opts.userId ?? guestId, createdAt);
    if (opts.status !== "PENDING") {
      insertHistory.run(randomUUID(), id, opts.status, "อัปเดตสถานะจากข้อมูลตัวอย่าง", adminId, now);
    }
    if (opts.paymentStatus === "PAID") {
      insertPayment.run(
        randomUUID(),
        id,
        opts.paymentMethod ?? "CARD",
        price.total,
        "PAID",
        `PAY-${code.replace("YH-", "")}`,
        null,
        opts.status === "PENDING" ? now : `${opts.checkIn}T05:00:00.000Z`,
        createdAt,
      );
    } else if (opts.paymentStatus === "PENDING_REVIEW") {
      insertPayment.run(
        randomUUID(),
        id,
        "BANK_TRANSFER",
        price.total,
        "PENDING",
        `TRF-${code.replace("YH-", "")}`,
        null,
        null,
        createdAt,
      );
    }
    return { id, code };
  }

  function monthsAgo(months: number, day: number): string {
    const base = new Date();
    return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - months, day))
      .toISOString()
      .slice(0, 10);
  }

  // ประวัติย้อนหลังสำหรับกราฟรายได้
  addBooking({ roomId: "room_dlx_101", checkIn: monthsAgo(5, 8), checkOut: monthsAgo(5, 11), guests: 2, status: "CHECKED_OUT", paymentStatus: "PAID", userId: "usr_nicha", guestName: "ณิชา ใจดี" });
  addBooking({ roomId: "room_prm_201", checkIn: monthsAgo(4, 12), checkOut: monthsAgo(4, 15), guests: 2, status: "CHECKED_OUT", paymentStatus: "PAID", paymentMethod: "BANK_TRANSFER" });
  addBooking({ roomId: "room_fam_301", checkIn: monthsAgo(3, 6), checkOut: monthsAgo(3, 9), guests: 4, status: "CHECKED_OUT", paymentStatus: "PAID", userId: "usr_nicha", guestName: "ณิชา ใจดี" });
  addBooking({ roomId: "room_vil_001", checkIn: monthsAgo(2, 18), checkOut: monthsAgo(2, 21), guests: 3, status: "CHECKED_OUT", paymentStatus: "PAID" });
  addBooking({ roomId: "room_hon_401", checkIn: monthsAgo(1, 14), checkOut: monthsAgo(1, 16), guests: 2, status: "CHECKED_OUT", paymentStatus: "PAID" });
  addBooking({ roomId: "room_std_102", checkIn: monthsAgo(1, 22), checkOut: monthsAgo(1, 24), guests: 1, status: "CHECKED_OUT", paymentStatus: "PAID", specialRequests: "ขอห้องชั้นล่างใกล้ลิฟต์" });

  // การจองปัจจุบันและอนาคต
  addBooking({ roomId: "room_dlx_101", checkIn: addDays(today, -2), checkOut: addDays(today, 1), guests: 2, status: "CHECKED_IN", paymentStatus: "PAID", specialRequests: "ขอหมอนเพิ่ม 1 ใบ" });
  addBooking({ roomId: "room_fam_301", checkIn: addDays(today, -1), checkOut: addDays(today, 2), guests: 4, status: "CHECKED_IN", paymentStatus: "PAID", userId: "usr_nicha", guestName: "ณิชา ใจดี", specialRequests: "มีเด็กอายุ 5 ปี ต้องการเตียงเสริม" });
  addBooking({ roomId: "room_prm_201", checkIn: addDays(today, 1), checkOut: addDays(today, 3), guests: 2, status: "CONFIRMED", paymentStatus: "PAID", specialRequests: "ฉลองครบรอบ 5 ปี" });
  addBooking({ roomId: "room_dlx_101", checkIn: addDays(today, 5), checkOut: addDays(today, 8), guests: 2, status: "CONFIRMED", paymentStatus: "PAID", paymentMethod: "BANK_TRANSFER" });
  addBooking({ roomId: "room_hon_401", checkIn: addDays(today, 3), checkOut: addDays(today, 5), guests: 2, status: "CONFIRMED", paymentStatus: "PAID", userId: "usr_nicha", guestName: "ณิชา ใจดี" });
  addBooking({ roomId: "room_vil_001", checkIn: addDays(today, 12), checkOut: addDays(today, 14), guests: 4, status: "PENDING", paymentStatus: "PENDING_REVIEW", specialRequests: "ต้องการจัดดอกไม้และเค้กวันเกิดในห้อง" });
  addBooking({ roomId: "room_std_102", checkIn: addDays(today, 20), checkOut: addDays(today, 22), guests: 1, status: "PENDING", paymentStatus: "UNPAID" });
  addBooking({ roomId: "room_prm_201", checkIn: addDays(today, 15), checkOut: addDays(today, 17), guests: 2, status: "CONFIRMED", paymentStatus: "PAID" });
  addBooking({ roomId: "room_fam_301", checkIn: addDays(today, 9), checkOut: addDays(today, 11), guests: 3, status: "PENDING", paymentStatus: "UNPAID", userId: "usr_nicha", guestName: "ณิชา ใจดี" });

  db.prepare(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('seeded_at', ?)",
  ).run(now);
}

function toPlainRow<T>(row: T): T {
  if (row === null || typeof row !== "object") return row;
  return { ...(row as object) } as T;
}

/**
 * node:sqlite returns rows with a null prototype. React Server Components can only
 * serialize plain objects, so normalize rows as they leave the database.
 */
function makeRowsPlain(db: DatabaseSync) {
  type Statement = ReturnType<DatabaseSync["prepare"]>;
  type Params = Parameters<Statement["all"]>;

  const originalPrepare = db.prepare.bind(db);

  db.prepare = ((sql: string) => {
    const statement = originalPrepare(sql);
    const originalAll = statement.all.bind(statement);
    const originalGet = statement.get.bind(statement);
    const originalIterate = statement.iterate.bind(statement);

    statement.all = ((...params: Params) => originalAll(...params).map((row) => toPlainRow(row))) as Statement["all"];
    statement.get = ((...params: Params) => toPlainRow(originalGet(...params))) as Statement["get"];
    statement.iterate = (function* (...params: Params) {
      for (const row of originalIterate(...params)) yield toPlainRow(row);
    }) as Statement["iterate"];

    return statement;
  }) as DatabaseSync["prepare"];
}

export function getDb(): DatabaseSync {
  if (process.env.NODE_ENV !== "production" && globalThis.__yohooDb) {
    return globalThis.__yohooDb;
  }

  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const db = new DatabaseSync(DB_PATH);
  makeRowsPlain(db);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
  seedDatabase(db);

  if (process.env.NODE_ENV !== "production") globalThis.__yohooDb = db;
  return db;
}

export function withTransaction<T>(operation: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = operation(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
