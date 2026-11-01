import { randomBytes, randomUUID } from "node:crypto";
import { getDb, withTransaction } from "./db";
import { AppError } from "./api";
import { addDays, diffDays, todayISO } from "./date";
import { calculatePrice } from "./money";
import type {
  BookingStatus,
  BookingWithRoom,
  PaymentWithBooking,
  User,
} from "./types";
import type { BookingCreateInput } from "./validation";
import type { Payment } from "./types";
import { isRoomAvailable } from "./rooms";

const BOOKING_SELECT = `
  SELECT b.*, r.name AS room_name, r.code AS room_code, r.slug AS room_slug,
    (SELECT url FROM room_images ri WHERE ri.room_id = r.id ORDER BY ri.sort_order LIMIT 1) AS room_image,
    u.name AS user_name
  FROM bookings b
  JOIN rooms r ON r.id = b.room_id
  JOIN users u ON u.id = b.user_id
`;

function generateCode(checkIn: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  const bytes = randomBytes(4);
  for (let i = 0; i < 4; i += 1) suffix += alphabet[bytes[i] % alphabet.length];
  return `YH-${checkIn.slice(2, 4)}${checkIn.slice(5, 7)}-${suffix}`;
}

export function createBooking(user: User, input: BookingCreateInput): BookingWithRoom {
  const today = todayISO();
  const nights = diffDays(input.checkIn, input.checkOut);

  if (input.checkIn < today) throw new AppError("ไม่สามารถจองวันในอดีตได้", 400, "PAST_DATE");
  if (nights < 1) throw new AppError("วันเช็คเอาต์ต้องหลังวันเช็คอิน", 422, "INVALID_DATES");
  if (nights > 30) throw new AppError("จองได้ครั้งละไม่เกิน 30 คืน", 422, "STAY_TOO_LONG");

  return withTransaction((db) => {
    const room = db
      .prepare("SELECT id, name, status, price_per_night, capacity FROM rooms WHERE id = ?")
      .get(input.roomId) as
      | { id: string; name: string; status: string; price_per_night: number; capacity: number }
      | undefined;

    if (!room) throw new AppError("ไม่พบห้องพักที่เลือก", 404, "ROOM_NOT_FOUND");
    if (room.status !== "AVAILABLE") throw new AppError("ห้องนี้ปิดให้บริการหรืออยู่ระหว่างปรับปรุง", 409, "ROOM_UNAVAILABLE");
    if (input.guests > room.capacity) {
      throw new AppError(`ห้องนี้รองรับผู้เข้าพักสูงสุด ${room.capacity} คน`, 422, "CAPACITY_EXCEEDED");
    }
    if (!isRoomAvailable(room.id, input.checkIn, input.checkOut)) {
      throw new AppError("ห้องนี้ถูกจองในวันที่เลือกแล้ว กรุณาเลือกวันที่หรือห้องอื่น", 409, "DATES_UNAVAILABLE");
    }

    const price = calculatePrice(room.price_per_night, nights);
    const id = randomUUID();
    let code = generateCode(input.checkIn);
    while (db.prepare("SELECT 1 FROM bookings WHERE code = ?").get(code)) {
      code = generateCode(input.checkIn);
    }
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO bookings (
        id, code, user_id, room_id, guest_name, guest_email, guest_phone, check_in, check_out,
        guests, nights, room_rate, subtotal, service_fee, tax, total, status, payment_status,
        special_requests, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'UNPAID', ?, ?, ?)`,
    ).run(
      id,
      code,
      user.id,
      room.id,
      input.guestName,
      input.guestEmail.toLowerCase(),
      input.guestPhone,
      input.checkIn,
      input.checkOut,
      input.guests,
      nights,
      room.price_per_night,
      price.subtotal,
      price.serviceFee,
      price.tax,
      price.total,
      input.specialRequests || null,
      now,
      now,
    );

    db.prepare(
      "INSERT INTO booking_status_history (id, booking_id, status, note, changed_by, created_at) VALUES (?, ?, 'PENDING', ?, ?, ?)",
    ).run(randomUUID(), id, "สร้างรายการจองใหม่", user.id, now);

    return db.prepare(`${BOOKING_SELECT} WHERE b.id = ?`).get(id) as unknown as BookingWithRoom;
  });
}

export function getBookingByCode(code: string): BookingWithRoom | null {
  const row = getDb().prepare(`${BOOKING_SELECT} WHERE b.code = ?`).get(code) as BookingWithRoom | undefined;
  return row ?? null;
}

export function getBookingsForUser(userId: string): BookingWithRoom[] {
  return getDb()
    .prepare(
      `${BOOKING_SELECT}
       WHERE b.user_id = ?
       ORDER BY CASE b.status WHEN 'CHECKED_IN' THEN 0 WHEN 'CONFIRMED' THEN 1 WHEN 'PENDING' THEN 2 ELSE 3 END,
         b.check_in ASC`,
    )
    .all(userId) as unknown as BookingWithRoom[];
}

export interface AdminBookingFilters {
  status?: string;
  payment?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export function getAdminBookings(filters: AdminBookingFilters = {}): BookingWithRoom[] {
  const where: string[] = ["1=1"];
  const params: (string | number)[] = [];
  if (filters.status && filters.status !== "ALL") {
    where.push("b.status = ?");
    params.push(filters.status);
  }
  if (filters.payment && filters.payment !== "ALL") {
    where.push("b.payment_status = ?");
    params.push(filters.payment);
  }
  if (filters.search) {
    where.push("(b.code LIKE ? OR b.guest_name LIKE ? OR r.name LIKE ? OR b.guest_phone LIKE ?)");
    const q = `%${filters.search}%`;
    params.push(q, q, q, q);
  }
  if (filters.from) {
    where.push("b.check_in >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    where.push("b.check_in <= ?");
    params.push(filters.to);
  }
  const limit = filters.limit ? `LIMIT ${Math.max(1, Math.min(500, filters.limit))}` : "";
  return getDb()
    .prepare(`${BOOKING_SELECT} WHERE ${where.join(" AND ")} ORDER BY b.created_at DESC ${limit}`)
    .all(...params) as unknown as BookingWithRoom[];
}

export function getRecentBookings(limit = 6): BookingWithRoom[] {
  return getDb()
    .prepare(`${BOOKING_SELECT} ORDER BY b.created_at DESC LIMIT ?`)
    .all(limit) as unknown as BookingWithRoom[];
}

export function getBookingPayments(bookingId: string): Payment[] {
  return getDb()
    .prepare("SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC")
    .all(bookingId) as unknown as Payment[];
}

export function getBookingHistory(bookingId: string) {
  return getDb()
    .prepare(
      `SELECT h.id, h.status, h.note, h.created_at, u.name AS changed_by_name
       FROM booking_status_history h
       LEFT JOIN users u ON u.id = h.changed_by
       WHERE h.booking_id = ?
       ORDER BY h.created_at ASC`,
    )
    .all(bookingId) as unknown as {
    id: string;
    status: BookingStatus;
    note: string | null;
    created_at: string;
    changed_by_name: string | null;
  }[];
}

export function cancelBooking(bookingCode: string, userId: string, reason: string): BookingWithRoom {
  return withTransaction((db) => {
    const booking = db
      .prepare("SELECT * FROM bookings WHERE code = ? AND user_id = ?")
      .get(bookingCode, userId) as BookingWithRoom | undefined;
    if (!booking) throw new AppError("ไม่พบรายการจองนี้", 404, "BOOKING_NOT_FOUND");
    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      throw new AppError("สถานะการจองนี้ไม่สามารถยกเลิกได้ กรุณาติดต่อโรงแรม", 409, "CANNOT_CANCEL");
    }
    if (booking.check_in < todayISO()) {
      throw new AppError("ไม่สามารถยกเลิกการจองที่ผ่านวันเข้าพักแล้ว", 409, "CANNOT_CANCEL");
    }

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE bookings SET status = 'CANCELLED', cancelled_at = ?, cancel_reason = ?, payment_status = CASE WHEN payment_status = 'PAID' THEN 'REFUNDED' ELSE payment_status END, updated_at = ? WHERE id = ?`,
    ).run(now, reason || "ยกเลิกโดยผู้เข้าพัก", now, booking.id);

    if (booking.payment_status === "PAID") {
      db.prepare("UPDATE payments SET status = 'REFUNDED' WHERE booking_id = ? AND status = 'PAID'").run(booking.id);
    }
    db.prepare(
      "INSERT INTO booking_status_history (id, booking_id, status, note, changed_by, created_at) VALUES (?, ?, 'CANCELLED', ?, ?, ?)",
    ).run(randomUUID(), booking.id, reason || "ยกเลิกโดยผู้เข้าพัก", userId, now);

    return db.prepare(`${BOOKING_SELECT} WHERE b.id = ?`).get(booking.id) as unknown as BookingWithRoom;
  });
}

const ALLOWED_TRANSITIONS: Record<string, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED"],
  CONFIRMED: ["CHECKED_IN", "REJECTED"],
  CHECKED_IN: ["CHECKED_OUT"],
  CHECKED_OUT: [],
  CANCELLED: [],
  REJECTED: [],
};

export function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  adminId: string,
  note: string,
): BookingWithRoom {
  return withTransaction((db) => {
    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId) as BookingWithRoom | undefined;
    if (!booking) throw new AppError("ไม่พบรายการจอง", 404, "BOOKING_NOT_FOUND");
    if (!ALLOWED_TRANSITIONS[booking.status]?.includes(status)) {
      throw new AppError(`ไม่สามารถเปลี่ยนสถานะจาก ${booking.status} เป็น ${status} ได้`, 409, "INVALID_TRANSITION");
    }

    const now = new Date().toISOString();
    const fields: string[] = ["status = ?", "updated_at = ?"];
    const params: (string | null)[] = [status, now];
    if (status === "CHECKED_IN") {
      fields.push("checked_in_at = ?");
      params.push(now);
    }
    if (status === "CHECKED_OUT") {
      fields.push("checked_out_at = ?");
      params.push(now);
    }
    if (status === "REJECTED") {
      fields.push("cancelled_at = ?", "cancel_reason = ?");
      params.push(now, note || "ปฏิเสธโดยผู้ดูแล");
      if (booking.payment_status === "PAID") {
        fields.push("payment_status = 'REFUNDED'");
        db.prepare("UPDATE payments SET status = 'REFUNDED' WHERE booking_id = ? AND status = 'PAID'").run(booking.id);
      }
    }
    params.push(bookingId);
    db.prepare(`UPDATE bookings SET ${fields.join(", ")} WHERE id = ?`).run(...params);

    db.prepare(
      "INSERT INTO booking_status_history (id, booking_id, status, note, changed_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(randomUUID(), booking.id, status, note || `เปลี่ยนสถานะเป็น ${status}`, adminId, now);

    return db.prepare(`${BOOKING_SELECT} WHERE b.id = ?`).get(bookingId) as unknown as BookingWithRoom;
  });
}

export function createPayment(
  user: User,
  input:
    | { method: "CARD"; bookingCode: string; cardName: string; cardNumber: string; expiry: string; cvv: string }
    | { method: "BANK_TRANSFER"; bookingCode: string; slipUrl: string },
): { booking: BookingWithRoom; payment: Payment } {
  return withTransaction((db) => {
    const booking = db
      .prepare("SELECT * FROM bookings WHERE code = ? AND user_id = ?")
      .get(input.bookingCode, user.id) as BookingWithRoom | undefined;
    if (!booking) throw new AppError("ไม่พบรายการจอง", 404, "BOOKING_NOT_FOUND");
    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      throw new AppError("รายการจองนี้ไม่สามารถชำระเงินได้", 409, "PAYMENT_NOT_ALLOWED");
    }
    if (booking.payment_status === "PAID") {
      throw new AppError("รายการจองนี้ชำระเงินเรียบร้อยแล้ว", 409, "ALREADY_PAID");
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    const isCard = input.method === "CARD";
    const reference = `${isCard ? "PAY" : "TRF"}-${Date.now().toString(36).toUpperCase()}`;
    const paymentStatus = isCard ? "PAID" : "PENDING";
    const bookingPaymentStatus = isCard ? "PAID" : "PENDING_REVIEW";

    db.prepare("UPDATE payments SET status = 'FAILED' WHERE booking_id = ? AND status = 'PENDING'").run(booking.id);
    db.prepare(
      `INSERT INTO payments (id, booking_id, method, amount, status, reference, slip_url, paid_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      booking.id,
      input.method,
      booking.total,
      paymentStatus,
      reference,
      input.method === "BANK_TRANSFER" ? input.slipUrl : null,
      isCard ? now : null,
      now,
    );
    db.prepare("UPDATE bookings SET payment_status = ?, updated_at = ? WHERE id = ?").run(bookingPaymentStatus, now, booking.id);
    db.prepare(
      "INSERT INTO booking_status_history (id, booking_id, status, note, changed_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(
      randomUUID(),
      booking.id,
      booking.status,
      isCard ? `ชำระเงินผ่านบัตร (จำลอง) ${reference}` : `อัปโหลดหลักฐานโอนเงิน ${reference}`,
      user.id,
      now,
    );

    return {
      booking: db.prepare(`${BOOKING_SELECT} WHERE b.id = ?`).get(booking.id) as unknown as BookingWithRoom,
      payment: db.prepare("SELECT * FROM payments WHERE id = ?").get(id) as unknown as Payment,
    };
  });
}

export function getAdminPayments(status?: string): PaymentWithBooking[] {
  const where = status && status !== "ALL" ? "WHERE p.status = ?" : "";
  return getDb()
    .prepare(
      `SELECT p.*, b.code AS booking_code, b.guest_name, b.total AS booking_total
       FROM payments p JOIN bookings b ON b.id = p.booking_id
       ${where}
       ORDER BY CASE p.status WHEN 'PENDING' THEN 0 ELSE 1 END, p.created_at DESC`,
    )
    .all(...(status && status !== "ALL" ? [status] : [])) as unknown as PaymentWithBooking[];
}

export function verifyPayment(paymentId: string, action: "APPROVE" | "REJECT", adminId: string): PaymentWithBooking {
  return withTransaction((db) => {
    const payment = db
      .prepare("SELECT p.*, b.code AS booking_code, b.guest_name, b.total AS booking_total FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE p.id = ?")
      .get(paymentId) as PaymentWithBooking | undefined;
    if (!payment) throw new AppError("ไม่พบรายการชำระเงิน", 404, "PAYMENT_NOT_FOUND");
    if (payment.status !== "PENDING") throw new AppError("รายการนี้ได้รับการตรวจสอบแล้ว", 409, "ALREADY_VERIFIED");

    const now = new Date().toISOString();
    if (action === "APPROVE") {
      db.prepare("UPDATE payments SET status = 'PAID', paid_at = ? WHERE id = ?").run(now, paymentId);
      db.prepare("UPDATE bookings SET payment_status = 'PAID', updated_at = ? WHERE id = ?").run(now, payment.booking_id);
      db.prepare(
        "INSERT INTO booking_status_history (id, booking_id, status, note, changed_by, created_at) VALUES (?, ?, (SELECT status FROM bookings WHERE id = ?), ?, ?, ?)",
      ).run(randomUUID(), payment.booking_id, payment.booking_id, `ตรวจสอบการชำระเงิน ${payment.reference} สำเร็จ`, adminId, now);
    } else {
      db.prepare("UPDATE payments SET status = 'FAILED' WHERE id = ?").run(paymentId);
      db.prepare("UPDATE bookings SET payment_status = 'FAILED', updated_at = ? WHERE id = ?").run(now, payment.booking_id);
      db.prepare(
        "INSERT INTO booking_status_history (id, booking_id, status, note, changed_by, created_at) VALUES (?, ?, (SELECT status FROM bookings WHERE id = ?), ?, ?, ?)",
      ).run(randomUUID(), payment.booking_id, payment.booking_id, `ปฏิเสธหลักฐานการโอนเงิน ${payment.reference}`, adminId, now);
    }

    return db
      .prepare("SELECT p.*, b.code AS booking_code, b.guest_name, b.total AS booking_total FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE p.id = ?")
      .get(paymentId) as unknown as PaymentWithBooking;
  });
}

export function getCalendarBookings(start: string, end: string): BookingWithRoom[] {
  return getDb()
    .prepare(
      `${BOOKING_SELECT}
       WHERE b.status IN ('PENDING','CONFIRMED','CHECKED_IN','CHECKED_OUT')
         AND b.check_in < ? AND b.check_out > ?
       ORDER BY b.check_in ASC`,
    )
    .all(end, start) as unknown as BookingWithRoom[];
}

export function getBookingById(bookingId: string): BookingWithRoom | null {
  const row = getDb().prepare(`${BOOKING_SELECT} WHERE b.id = ?`).get(bookingId) as BookingWithRoom | undefined;
  return row ?? null;
}

export function getNextSevenDaysSummary(): { date: string; arrivals: number; departures: number }[] {
  const db = getDb();
  const today = todayISO();
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index);
    const arrivals = Number(
      (db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE check_in = ? AND status IN ('CONFIRMED','CHECKED_IN')").get(date) as { n: number }).n,
    );
    const departures = Number(
      (db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE check_out = ? AND status IN ('CONFIRMED','CHECKED_IN')").get(date) as { n: number }).n,
    );
    return { date, arrivals, departures };
  });
}
