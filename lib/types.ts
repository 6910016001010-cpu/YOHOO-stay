export type Role = "GUEST" | "ADMIN";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED"
  | "REJECTED";

export type PaymentStatus = "UNPAID" | "PENDING_REVIEW" | "PAID" | "FAILED" | "REFUNDED";

export type RoomStatus = "AVAILABLE" | "MAINTENANCE" | "INACTIVE";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  created_at: string;
}

export interface RoomType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Amenity {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface RoomImage {
  id: string;
  room_id: string;
  url: string;
  alt: string;
  sort_order: number;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  slug: string;
  type_id: string;
  type_name?: string;
  type_slug?: string;
  description: string;
  price_per_night: number;
  capacity: number;
  size_sqm: number;
  bed_type: string;
  floor: string;
  status: RoomStatus;
  featured: number;
  created_at: string;
  updated_at: string;
}

export interface RoomWithDetails extends Room {
  images: RoomImage[];
  amenities: Amenity[];
}

export interface Booking {
  id: string;
  code: string;
  user_id: string;
  room_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  room_rate: number;
  subtotal: number;
  service_fee: number;
  tax: number;
  total: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  special_requests: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  cancel_reason: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
}

export interface BookingWithRoom extends Booking {
  room_name: string;
  room_code: string;
  room_slug: string;
  room_image: string | null;
  user_name?: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  method: "CARD" | "BANK_TRANSFER";
  amount: number;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  reference: string;
  slip_url: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface PaymentWithBooking extends Payment {
  booking_code: string;
  guest_name: string;
  booking_total: number;
}
