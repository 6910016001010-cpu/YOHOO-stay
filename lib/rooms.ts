import { getDb } from "./db";
import type { Amenity, Room, RoomImage, RoomType, RoomWithDetails } from "./types";

export interface RoomSearchFilters {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  sort?: "recommended" | "price_asc" | "price_desc" | "size_desc";
}

interface RawRoom extends Room {
  type_name: string;
  type_slug: string;
  cover_url: string | null;
  booking_count?: number;
  upcoming_count?: number;
}

function hydrateRooms(rows: RawRoom[]): RoomWithDetails[] {
  if (rows.length === 0) return [];
  const db = getDb();
  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(",");

  const images = db
    .prepare(
      `SELECT id, room_id, url, alt, sort_order FROM room_images WHERE room_id IN (${placeholders}) ORDER BY sort_order ASC`,
    )
    .all(...ids) as unknown as RoomImage[];

  const amenities = db
    .prepare(
      `SELECT ra.room_id, a.id, a.name, a.slug, a.icon
       FROM room_amenities ra
       JOIN amenities a ON a.id = ra.amenity_id
       WHERE ra.room_id IN (${placeholders})
       ORDER BY a.name ASC`,
    )
    .all(...ids) as unknown as (Amenity & { room_id: string })[];

  const imageMap = new Map<string, RoomImage[]>();
  for (const image of images) {
    const list = imageMap.get(image.room_id) ?? [];
    list.push(image);
    imageMap.set(image.room_id, list);
  }
  const amenityMap = new Map<string, Amenity[]>();
  for (const amenity of amenities) {
    const list = amenityMap.get(amenity.room_id) ?? [];
    list.push({ id: amenity.id, name: amenity.name, slug: amenity.slug, icon: amenity.icon });
    amenityMap.set(amenity.room_id, list);
  }

  return rows.map((row) => ({
    ...row,
    images: imageMap.get(row.id) ?? [],
    amenities: amenityMap.get(row.id) ?? [],
  }));
}

const BASE_SELECT = `
  SELECT r.*, rt.name AS type_name, rt.slug AS type_slug,
    (SELECT url FROM room_images ri WHERE ri.room_id = r.id ORDER BY ri.sort_order ASC LIMIT 1) AS cover_url
  FROM rooms r
  JOIN room_types rt ON rt.id = r.type_id
`;

export function searchRooms(filters: RoomSearchFilters = {}): RoomWithDetails[] {
  const db = getDb();
  const where: string[] = ["r.status = 'AVAILABLE'"];
  const params: (string | number)[] = [];

  if (filters.guests && filters.guests > 1) {
    where.push("r.capacity >= ?");
    params.push(filters.guests);
  }
  if (filters.type) {
    where.push("rt.slug = ?");
    params.push(filters.type);
  }
  if (filters.minPrice !== undefined) {
    where.push("r.price_per_night >= ?");
    params.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    where.push("r.price_per_night <= ?");
    params.push(filters.maxPrice);
  }
  if (filters.checkIn && filters.checkOut) {
    where.push(`NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.room_id = r.id
        AND b.status IN ('PENDING','CONFIRMED','CHECKED_IN')
        AND b.check_in < ?
        AND b.check_out > ?
    )`);
    params.push(filters.checkOut, filters.checkIn);
  }
  for (const amenity of filters.amenities ?? []) {
    where.push("EXISTS (SELECT 1 FROM room_amenities ra JOIN amenities a ON a.id = ra.amenity_id WHERE ra.room_id = r.id AND a.slug = ?)");
    params.push(amenity);
  }

  let order = "r.featured DESC, r.price_per_night ASC";
  if (filters.sort === "price_asc") order = "r.price_per_night ASC";
  if (filters.sort === "price_desc") order = "r.price_per_night DESC";
  if (filters.sort === "size_desc") order = "r.size_sqm DESC";

  const rows = db.prepare(`${BASE_SELECT} WHERE ${where.join(" AND ")} ORDER BY ${order}`).all(...params) as unknown as RawRoom[];
  return hydrateRooms(rows);
}

export function getFeaturedRooms(limit = 4): RoomWithDetails[] {
  const rows = getDb()
    .prepare(`${BASE_SELECT} WHERE r.status = 'AVAILABLE' AND r.featured = 1 ORDER BY r.price_per_night ASC LIMIT ?`)
    .all(limit) as unknown as RawRoom[];
  return hydrateRooms(rows);
}

export function getRoomBySlug(slug: string): RoomWithDetails | null {
  const row = getDb().prepare(`${BASE_SELECT} WHERE r.slug = ?`).get(slug) as RawRoom | undefined;
  return row ? hydrateRooms([row])[0] : null;
}

export function getRoomById(id: string): RoomWithDetails | null {
  const row = getDb().prepare(`${BASE_SELECT} WHERE r.id = ?`).get(id) as RawRoom | undefined;
  return row ? hydrateRooms([row])[0] : null;
}

export function getRoomTypes(): RoomType[] {
  return getDb().prepare("SELECT id, name, slug, description FROM room_types ORDER BY name ASC").all() as unknown as RoomType[];
}

export function getAmenities(): Amenity[] {
  return getDb().prepare("SELECT id, name, slug, icon FROM amenities ORDER BY name ASC").all() as unknown as Amenity[];
}

export interface AdminRoom extends RoomWithDetails {
  bookingCount: number;
  upcomingCount: number;
}

export function getRoomsForAdmin(): AdminRoom[] {
  const rows = getDb()
    .prepare(
      `${BASE_SELECT.replace("FROM rooms r", ", (SELECT COUNT(*) FROM bookings b WHERE b.room_id = r.id) AS booking_count, (SELECT COUNT(*) FROM bookings b WHERE b.room_id = r.id AND b.check_in >= date('now') AND b.status IN ('PENDING','CONFIRMED','CHECKED_IN')) AS upcoming_count FROM rooms r")}
       ORDER BY CASE r.status WHEN 'AVAILABLE' THEN 0 WHEN 'MAINTENANCE' THEN 1 ELSE 2 END, r.code ASC`,
    )
    .all() as unknown as RawRoom[];

  return hydrateRooms(rows).map((room) => {
    const raw = rows.find((row) => row.id === room.id);
    return { ...room, bookingCount: Number(raw?.booking_count ?? 0), upcomingCount: Number(raw?.upcoming_count ?? 0) };
  });
}

interface BookedRange {
  check_in: string;
  check_out: string;
  status: string;
  code: string;
}

export function getRoomBookedRanges(roomId: string, from?: string, to?: string): BookedRange[] {
  const db = getDb();
  if (from && to) {
    return db
      .prepare(
        `SELECT check_in, check_out, status, code FROM bookings
         WHERE room_id = ? AND status IN ('PENDING','CONFIRMED','CHECKED_IN')
           AND check_in < ? AND check_out > ?
         ORDER BY check_in ASC`,
      )
      .all(roomId, to, from) as unknown as BookedRange[];
  }
  return db
    .prepare(
      `SELECT check_in, check_out, status, code FROM bookings
       WHERE room_id = ? AND status IN ('PENDING','CONFIRMED','CHECKED_IN') AND check_out >= date('now')
       ORDER BY check_in ASC`,
    )
    .all(roomId) as unknown as BookedRange[];
}

export function isRoomAvailable(roomId: string, checkIn: string, checkOut: string, excludeBookingId?: string): boolean {
  const db = getDb();
  const room = db.prepare("SELECT status FROM rooms WHERE id = ?").get(roomId) as { status: string } | undefined;
  if (!room || room.status !== "AVAILABLE") return false;

  const row = db
    .prepare(
      `SELECT COUNT(*) AS n FROM bookings
       WHERE room_id = ?
         AND status IN ('PENDING','CONFIRMED','CHECKED_IN')
         AND check_in < ?
         AND check_out > ?
         ${excludeBookingId ? "AND id != ?" : ""}`,
    )
    .get(...(excludeBookingId ? [roomId, checkOut, checkIn, excludeBookingId] : [roomId, checkOut, checkIn])) as {
    n: number;
  };
  return Number(row.n) === 0;
}
