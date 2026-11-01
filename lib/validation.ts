import { z } from "zod";
import { isValidISODate } from "./date";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง")
  .refine(isValidISODate, "วันที่ไม่ถูกต้อง");

export const loginSchema = z.object({
  email: z.string().trim().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร").max(80, "ชื่อยาวเกินไป"),
    email: z.string().trim().email("อีเมลไม่ถูกต้อง"),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s()]{9,20}$/, "เบอร์โทรไม่ถูกต้อง")
      .optional()
      .or(z.literal("")),
    password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(100, "รหัสผ่านยาวเกินไป"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export const bookingCreateSchema = z
  .object({
    roomId: z.string().min(1, "ไม่พบห้องที่เลือก"),
    checkIn: isoDate,
    checkOut: isoDate,
    guests: z.coerce.number().int("จำนวนผู้เข้าพักต้องเป็นจำนวนเต็ม").min(1, "ต้องมีผู้เข้าพักอย่างน้อย 1 คน").max(6, "ผู้เข้าพักสูงสุด 6 คน"),
    guestName: z.string().trim().min(2, "กรุณากรอกชื่อผู้เข้าพัก").max(80, "ชื่อยาวเกินไป"),
    guestEmail: z.string().trim().email("อีเมลไม่ถูกต้อง"),
    guestPhone: z.string().trim().regex(/^[0-9+\-\s()]{9,20}$/, "เบอร์โทรไม่ถูกต้อง"),
    specialRequests: z.string().trim().max(500, "ข้อความยาวเกิน 500 ตัวอักษร").optional().or(z.literal("")),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: "วันเช็คเอาต์ต้องหลังวันเช็คอิน",
    path: ["checkOut"],
  });

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(300, "เหตุผลยาวเกินไป").optional().or(z.literal("")),
});

const cardPayment = z.object({
  method: z.literal("CARD"),
  bookingCode: z.string().min(1),
  cardName: z.string().trim().min(2, "กรุณากรอกชื่อบนบัตร"),
  cardNumber: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s/g, ""))
    .refine((value) => /^\d{16}$/.test(value), "หมายเลขบัตรต้องมี 16 หลัก"),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "วันหมดอายุรูปแบบ MM/YY"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV ต้องมี 3–4 หลัก"),
});

const transferPayment = z.object({
  method: z.literal("BANK_TRANSFER"),
  bookingCode: z.string().min(1),
  slipUrl: z.string().min(1, "กรุณาอัปโหลดหลักฐานการโอนเงิน"),
});

export const paymentSchema = z.discriminatedUnion("method", [cardPayment, transferPayment]);

export const adminBookingStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "REJECTED"]),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const adminPaymentActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
});

export const roomSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "รหัสห้องต้องมีอย่างน้อย 2 ตัวอักษร")
    .max(20)
    .regex(/^[A-Z0-9-]+$/, "ใช้ได้เฉพาะ A-Z, 0-9 และ -"),
  name: z.string().trim().min(2, "กรุณากรอกชื่อห้อง").max(100),
  typeId: z.string().min(1, "กรุณาเลือกประเภทห้อง"),
  description: z.string().trim().min(20, "คำอธิบายควรมีอย่างน้อย 20 ตัวอักษร").max(2000),
  pricePerNight: z.coerce.number().int().min(100, "ราคาต้องมากกว่า 100 บาท").max(1_000_000),
  capacity: z.coerce.number().int().min(1, "ความจุอย่างน้อย 1 คน").max(6),
  sizeSqm: z.coerce.number().int().min(1, "ขนาดต้องมากกว่า 0").max(1000),
  bedType: z.string().trim().min(1, "กรุณากรอกประเภทเตียง").max(80),
  floor: z.string().trim().min(1, "กรุณากรอกชั้น").max(20),
  status: z.enum(["AVAILABLE", "MAINTENANCE", "INACTIVE"]),
  featured: z.boolean().default(false),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().trim().min(1, "URL รูปไม่ถูกต้อง")).min(1, "กรุณาเพิ่มรูปอย่างน้อย 1 รูป").max(8),
});

export const roomDeleteSchema = z.object({});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type RoomInput = z.infer<typeof roomSchema>;
