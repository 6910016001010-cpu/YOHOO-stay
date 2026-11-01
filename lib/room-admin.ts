import { randomUUID } from "node:crypto";
import { AppError } from "./api";
import { getDb, withTransaction } from "./db";
import type { RoomWithDetails } from "./types";
import type { RoomInput } from "./validation";
import { getRoomById } from "./rooms";

function slugBase(code: string): string {
  return code
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueSlug(db: ReturnType<typeof getDb>, code: string, currentRoomId?: string): string {
  const base = slugBase(code) || `room-${Date.now()}`;
  let slug = base;
  let index = 2;
  while (true) {
    const existing = db.prepare("SELECT id FROM rooms WHERE slug = ?").get(slug) as { id: string } | undefined;
    if (!existing || existing.id === currentRoomId) return slug;
    slug = `${base}-${index}`;
    index += 1;
  }
}

function assertCodeUnique(db: ReturnType<typeof getDb>, code: string, currentRoomId?: string) {
  const existing = db.prepare("SELECT id FROM rooms WHERE code = ?").get(code.toUpperCase()) as { id: string } | undefined;
  if (existing && existing.id !== currentRoomId) {
    throw new AppError("รหัสห้องนี้ถูกใช้งานแล้ว", 409, "DUPLICATE_CODE", { code: ["รหัสห้องนี้ถูกใช้งานแล้ว"] });
  }
}

function saveImages(db: ReturnType<typeof getDb>, roomId: string, images: string[]) {
  db.prepare("DELETE FROM room_images WHERE room_id = ?").run(roomId);
  const insert = db.prepare("INSERT INTO room_images (id, room_id, url, alt, sort_order) VALUES (?, ?, ?, ?, ?)");
  images.forEach((url, index) => {
    insert.run(randomUUID(), roomId, url, `ภาพห้องพัก ${index + 1}`, index);
  });
}

function saveAmenities(db: ReturnType<typeof getDb>, roomId: string, amenityIds: string[]) {
  db.prepare("DELETE FROM room_amenities WHERE room_id = ?").run(roomId);
  const insert = db.prepare("INSERT OR IGNORE INTO room_amenities (room_id, amenity_id) VALUES (?, ?)");
  for (const amenityId of amenityIds) insert.run(roomId, amenityId);
}

export function createRoom(input: RoomInput): RoomWithDetails {
  return withTransaction((db) => {
    const type = db.prepare("SELECT id FROM room_types WHERE id = ?").get(input.typeId);
    if (!type) throw new AppError("ไม่พบประเภทห้องที่เลือก", 422, "INVALID_TYPE");
    assertCodeUnique(db, input.code);
    const now = new Date().toISOString();
    const id = randomUUID();
    const slug = uniqueSlug(db, input.code);
    db.prepare(
      `INSERT INTO rooms (id, code, name, slug, type_id, description, price_per_night, capacity, size_sqm, bed_type, floor, status, featured, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.code.toUpperCase(),
      input.name,
      slug,
      input.typeId,
      input.description,
      input.pricePerNight,
      input.capacity,
      input.sizeSqm,
      input.bedType,
      input.floor,
      input.status,
      input.featured ? 1 : 0,
      now,
      now,
    );
    saveImages(db, id, input.images);
    saveAmenities(db, id, input.amenities);
    return getRoomById(id)!;
  });
}

export function updateRoom(roomId: string, input: RoomInput): RoomWithDetails {
  return withTransaction((db) => {
    const existing = db.prepare("SELECT id FROM rooms WHERE id = ?").get(roomId);
    if (!existing) throw new AppError("ไม่พบห้องพัก", 404, "ROOM_NOT_FOUND");
    const type = db.prepare("SELECT id FROM room_types WHERE id = ?").get(input.typeId);
    if (!type) throw new AppError("ไม่พบประเภทห้องที่เลือก", 422, "INVALID_TYPE");
    assertCodeUnique(db, input.code, roomId);
    const slug = uniqueSlug(db, input.code, roomId);
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE rooms SET code = ?, name = ?, slug = ?, type_id = ?, description = ?, price_per_night = ?,
       capacity = ?, size_sqm = ?, bed_type = ?, floor = ?, status = ?, featured = ?, updated_at = ? WHERE id = ?`,
    ).run(
      input.code.toUpperCase(),
      input.name,
      slug,
      input.typeId,
      input.description,
      input.pricePerNight,
      input.capacity,
      input.sizeSqm,
      input.bedType,
      input.floor,
      input.status,
      input.featured ? 1 : 0,
      now,
      roomId,
    );
    saveImages(db, roomId, input.images);
    saveAmenities(db, roomId, input.amenities);
    return getRoomById(roomId)!;
  });
}

export function deleteRoom(roomId: string): void {
  const db = getDb();
  const room = db.prepare("SELECT id, name FROM rooms WHERE id = ?").get(roomId) as { id: string; name: string } | undefined;
  if (!room) throw new AppError("ไม่พบห้องพัก", 404, "ROOM_NOT_FOUND");
  const count = Number((db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE room_id = ?").get(roomId) as { n: number }).n);
  if (count > 0) {
    throw new AppError("ห้องนี้มีประวัติการจองแล้ว ไม่สามารถลบได้ กรุณาตั้งสถานะเป็นปิดใช้งานแทน", 409, "ROOM_HAS_BOOKINGS");
  }
  db.prepare("DELETE FROM rooms WHERE id = ?").run(roomId);
}

export function updateRoomStatus(roomId: string, status: "AVAILABLE" | "MAINTENANCE" | "INACTIVE"): void {
  const db = getDb();
  const result = db.prepare("UPDATE rooms SET status = ?, updated_at = ? WHERE id = ?").run(
    status,
    new Date().toISOString(),
    roomId,
  );
  if (Number(result.changes) === 0) throw new AppError("ไม่พบห้องพัก", 404, "ROOM_NOT_FOUND");
}
