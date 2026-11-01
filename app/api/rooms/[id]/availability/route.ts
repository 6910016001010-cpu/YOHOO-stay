import { AppError, apiSuccess, handleApiError } from "@/lib/api";
import { getRoomById, isRoomAvailable } from "@/lib/rooms";
import { addDays, isValidISODate, todayISO } from "@/lib/date";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const checkIn = url.searchParams.get("checkIn") ?? "";
    const checkOut = url.searchParams.get("checkOut") ?? "";
    if (!isValidISODate(checkIn) || !isValidISODate(checkOut) || checkOut <= checkIn) {
      throw new AppError("ช่วงวันที่ไม่ถูกต้อง", 400, "INVALID_DATES");
    }
    if (checkIn < todayISO()) throw new AppError("ไม่สามารถเลือกวันในอดีตได้", 400, "PAST_DATE");
    const room = getRoomById(id);
    if (!room) throw new AppError("ไม่พบห้องพัก", 404, "ROOM_NOT_FOUND");
    if (room.status !== "AVAILABLE") {
      return apiSuccess({ available: false, reason: "ห้องนี้ปิดให้บริการหรืออยู่ระหว่างปรับปรุง" });
    }
    const available = isRoomAvailable(room.id, checkIn, checkOut);
    return apiSuccess({
      available,
      reason: available ? null : "ห้องนี้ถูกจองในช่วงวันที่เลือกแล้ว",
      checkIn,
      checkOut,
      suggestedCheckIn: available ? null : addDays(checkIn, 2),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
