import Link from "next/link";
import { BedDouble, CalendarDays, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { getCalendarBookings } from "@/lib/bookings";
import { getRoomsForAdmin } from "@/lib/rooms";
import { getMonthOccupancy } from "@/lib/analytics";
import { diffDays, eachDate, formatMonthThai, formatThaiDate, formatWeekdayShort, monthBounds, monthKey, shiftMonth, todayISO } from "@/lib/date";
import { BOOKING_STATUS_LABELS } from "@/lib/status";
import type { BookingStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "ปฏิทินห้องพัก" };

const LEGEND: BookingStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT"];

function isWeekend(date: string): boolean {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const monthParam = typeof params.month === "string" ? params.month : "";
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam) ? monthParam : monthKey();
  const bounds = monthBounds(month);
  const days = eachDate(bounds.start, bounds.end);
  const today = todayISO();

  const rooms = getRoomsForAdmin();
  const bookings = getCalendarBookings(bounds.start, bounds.end);
  const byRoom = new Map<string, typeof bookings>();
  for (const booking of bookings) {
    const list = byRoom.get(booking.room_id) ?? [];
    list.push(booking);
    byRoom.set(booking.room_id, list);
  }

  const occupancy = getMonthOccupancy(month, rooms.filter((room) => room.status !== "INACTIVE").length);
  const activeBookings = bookings.filter((booking) => booking.status !== "CHECKED_OUT").length;
  const arrivals = bookings.filter((booking) => booking.check_in >= bounds.start && booking.check_in < bounds.end).length;
  const departures = bookings.filter((booking) => booking.check_out > bounds.start && booking.check_out <= bounds.end).length;

  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <span className="eyebrow">Calendar</span>
          <h1>ปฏิทินห้องพัก</h1>
          <p>ดูการจองของทุกห้องแบบรายเดือน เพื่อวางแผนแม่บ้าน การเข้าพัก และการปิดปรับปรุง</p>
        </div>
        <div className="admin-head-actions">
          <Link href="/admin/bookings" className="btn btn-outline btn-sm">
            <CalendarDays size={14} /> ดูรายการจอง
          </Link>
        </div>
      </div>

      <div className="admin-mini-stats">
        <div>
          <span>การจองในเดือนนี้</span>
          <strong>{bookings.length} รายการ</strong>
        </div>
        <div>
          <span>กำลังจะเข้าพัก</span>
          <strong>{activeBookings} รายการ</strong>
        </div>
        <div>
          <span>แขกเข้า / ออก</span>
          <strong>
            {arrivals} / {departures}
          </strong>
        </div>
        <div>
          <span>อัตราการเข้าพัก</span>
          <strong>{occupancy}%</strong>
        </div>
      </div>

      <section className="panel calendar-panel">
        <div className="calendar-head">
          <div className="calendar-nav">
            <Link href={`/admin/calendar?month=${prevMonth}`} className="btn btn-ghost btn-icon" aria-label="เดือนก่อนหน้า">
              <ChevronLeft size={17} />
            </Link>
            <div>
              <span className="eyebrow">Room timeline</span>
              <h2>{formatMonthThai(month)}</h2>
            </div>
            <Link href={`/admin/calendar?month=${nextMonth}`} className="btn btn-ghost btn-icon" aria-label="เดือนถัดไป">
              <ChevronRight size={17} />
            </Link>
          </div>

          <div className="calendar-legend">
            {LEGEND.map((status) => (
              <span key={status} className={`legend-item cal-color-${status.toLowerCase()}`}>
                <i /> {BOOKING_STATUS_LABELS[status]}
              </span>
            ))}
            <Link href="/admin/calendar" className="btn btn-outline btn-sm">
              เดือนนี้
            </Link>
          </div>
        </div>

        {rooms.length === 0 ? (
          <div className="admin-empty">
            <BedDouble size={24} />
            <h3>ยังไม่มีห้องพักในระบบ</h3>
            <p>เพิ่มห้องพักก่อนเพื่อเริ่มดูปฏิทินการเข้าพัก</p>
            <Link href="/admin/rooms/new" className="btn btn-sm">
              เพิ่มห้องพัก
            </Link>
          </div>
        ) : (
          <div className="calendar-scroll">
            <div className="calendar-grid" style={{ minWidth: `${Math.max(920, 160 + days.length * 40)}px` }}>
              <div className="cal-head-row">
                <div className="cal-room-head">
                  <BedDouble size={14} /> ห้องพัก
                </div>
                <div className="cal-day-heads">
                  {days.map((day) => (
                    <div key={day} className={`cal-day-head ${isWeekend(day) ? "weekend" : ""} ${day === today ? "today" : ""}`}>
                      <span>{formatWeekdayShort(day)}</span>
                      <strong>{Number(day.slice(8, 10))}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {rooms.map((room) => {
                const roomBookings = byRoom.get(room.id) ?? [];
                return (
                  <div className={`cal-row ${room.status === "INACTIVE" ? "room-inactive" : ""}`} key={room.id}>
                    <div className="cal-room-cell">
                      <strong>{room.code}</strong>
                      <span>{room.name}</span>
                      {room.status !== "AVAILABLE" && (
                        <small className={`badge ${room.status === "MAINTENANCE" ? "badge-maintenance" : "badge-inactive"}`}>
                          {room.status === "MAINTENANCE" ? "ปิดปรับปรุง" : "ปิดใช้งาน"}
                        </small>
                      )}
                    </div>
                    <div className="cal-track">
                      <div className="cal-cells">
                        {days.map((day) => (
                          <div
                            key={day}
                            className={`cal-day-cell ${isWeekend(day) ? "weekend" : ""} ${day === today ? "today" : ""}`}
                          />
                        ))}
                      </div>
                      {roomBookings.map((booking) => {
                        const from = booking.check_in < bounds.start ? 0 : diffDays(bounds.start, booking.check_in);
                        const to = booking.check_out > bounds.end ? days.length : diffDays(bounds.start, booking.check_out);
                        const left = (from / days.length) * 100;
                        const width = (Math.max(1, to - from) / days.length) * 100;
                        return (
                          <Link
                            key={booking.id}
                            href={`/admin/bookings?search=${booking.code}`}
                            className={`cal-bar cal-color-${booking.status.toLowerCase()}`}
                            style={{ left: `${left}%`, width: `calc(${width}% - 3px)` }}
                            title={`${booking.code} · ${booking.guest_name} · ${formatThaiDate(booking.check_in, "short")} – ${formatThaiDate(booking.check_out, "short")} · ${BOOKING_STATUS_LABELS[booking.status]}`}
                          >
                            <span className="cal-bar-code">{booking.code}</span>
                            <span className="cal-bar-name">{booking.guest_name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <div className="info-banner info" style={{ marginTop: 20 }}>
        <Info size={15} />
        <span>
          แถบสีแสดงช่วงวันที่เข้าพัก · คลิกที่แถบเพื่อไปยังรายการจองนั้น · วันหยุดสุดสัปดาห์แสดงด้วยพื้นหลังสีอ่อน
        </span>
      </div>
    </div>
  );
}
