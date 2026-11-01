import type { BookingStatus, PaymentStatus, RoomStatus } from "./types";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "รออนุมัติ",
  CONFIRMED: "ยืนยันแล้ว",
  CHECKED_IN: "กำลังเข้าพัก",
  CHECKED_OUT: "เช็คเอาต์แล้ว",
  CANCELLED: "ยกเลิกแล้ว",
  REJECTED: "ถูกปฏิเสธ",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "ยังไม่ชำระ",
  PENDING_REVIEW: "รอตรวจสอบ",
  PAID: "ชำระแล้ว",
  FAILED: "ชำระไม่สำเร็จ",
  REFUNDED: "คืนเงินแล้ว",
};

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  AVAILABLE: "เปิดให้จอง",
  MAINTENANCE: "ปิดปรับปรุง",
  INACTIVE: "ปิดใช้งาน",
};

export const BOOKING_STATUS_CLASS: Record<BookingStatus, string> = {
  PENDING: "badge-pending",
  CONFIRMED: "badge-confirmed",
  CHECKED_IN: "badge-checked_in",
  CHECKED_OUT: "badge-checked_out",
  CANCELLED: "badge-cancelled",
  REJECTED: "badge-rejected",
};

export const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  UNPAID: "badge-unpaid",
  PENDING_REVIEW: "badge-pending_review",
  PAID: "badge-paid",
  FAILED: "badge-failed",
  REFUNDED: "badge-refunded",
};

export const ROOM_STATUS_CLASS: Record<RoomStatus, string> = {
  AVAILABLE: "badge-available",
  MAINTENANCE: "badge-maintenance",
  INACTIVE: "badge-inactive",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: "บัตรเครดิต",
  BANK_TRANSFER: "โอนเงิน",
};

export const BOOKING_FLOW: BookingStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT"];
