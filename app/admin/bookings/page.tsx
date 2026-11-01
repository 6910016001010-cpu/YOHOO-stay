import Link from "next/link";
import { CalendarDays, Filter, RotateCcw, Search } from "lucide-react";
import { getAdminBookings } from "@/lib/bookings";
import { formatDateRange, formatThaiDate, formatThaiDateTime, todayISO } from "@/lib/date";
import { formatTHB } from "@/lib/money";
import {
  BOOKING_STATUS_CLASS,
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_CLASS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/status";
import type { BookingStatus, PaymentStatus } from "@/lib/types";
import { BookingActions } from "@/components/admin/booking-actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "การจองทั้งหมด" };

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "PENDING", label: "รออนุมัติ" },
  { value: "CONFIRMED", label: "ยืนยันแล้ว" },
  { value: "CHECKED_IN", label: "กำลังเข้าพัก" },
  { value: "CHECKED_OUT", label: "เช็คเอาต์แล้ว" },
  { value: "CANCELLED", label: "ยกเลิก" },
  { value: "REJECTED", label: "ถูกปฏิเสธ" },
];

const PAYMENT_OPTIONS = ["ALL", "UNPAID", "PENDING_REVIEW", "PAID", "FAILED", "REFUNDED"];

function readParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = readParam(params.status) || "ALL";
  const payment = readParam(params.payment) || "ALL";
  const search = readParam(params.search);
  const from = readParam(params.from);
  const to = readParam(params.to);

  const allBookings = getAdminBookings({ limit: 500 });
  const bookings = getAdminBookings({
    status,
    payment,
    search: search || undefined,
    from: from || undefined,
    to: to || undefined,
    limit: 300,
  });

  const counts: Record<string, number> = { ALL: allBookings.length };
  for (const booking of allBookings) {
    counts[booking.status] = (counts[booking.status] ?? 0) + 1;
  }

  const totalValue = bookings.reduce((total, booking) => total + booking.total, 0);
  const actionable = bookings.filter((booking) => ["PENDING", "CONFIRMED", "CHECKED_IN"].includes(booking.status)).length;

  function tabHref(value: string) {
    const query = new URLSearchParams();
    if (value !== "ALL") query.set("status", value);
    if (payment !== "ALL") query.set("payment", payment);
    if (search) query.set("search", search);
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    const qs = query.toString();
    return `/admin/bookings${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <span className="eyebrow">Reservations</span>
          <h1>การจองทั้งหมด</h1>
          <p>อนุมัติ ปฏิเสธ เช็คอิน และเช็คเอาต์ พร้อมดูรายละเอียดผู้เข้าพักทุกคนในที่เดียว</p>
        </div>
        <div className="admin-head-actions">
          <Link href="/admin/calendar" className="btn btn-outline btn-sm">
            <CalendarDays size={14} /> ดูปฏิทินห้องพัก
          </Link>
        </div>
      </div>

      <div className="admin-mini-stats">
        <div>
          <span>รายการที่พบ</span>
          <strong>{bookings.length} รายการ</strong>
        </div>
        <div>
          <span>มูลค่ารวม</span>
          <strong>{formatTHB(totalValue)}</strong>
        </div>
        <div>
          <span>รอดำเนินการ</span>
          <strong>{actionable} รายการ</strong>
        </div>
        <div>
          <span>รออนุมัติทั้งหมด</span>
          <strong>{counts.PENDING ?? 0} รายการ</strong>
        </div>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="กรองตามสถานะการจอง">
        {STATUS_TABS.map((tab) => (
          <Link key={tab.value} href={tabHref(tab.value)} className={`admin-tab ${status === tab.value ? "active" : ""}`}>
            {tab.label}
            <span className="tab-count">{counts[tab.value] ?? 0}</span>
          </Link>
        ))}
      </div>

      <form className="admin-filter panel" method="get">
        <input type="hidden" name="status" value={status} />
        <div className="field">
          <label htmlFor="booking-search">ค้นหา</label>
          <div className="input-wrap">
            <Search size={15} />
            <input
              className="input"
              id="booking-search"
              name="search"
              defaultValue={search}
              placeholder="รหัสจอง ชื่อแขก ห้อง หรือเบอร์โทร"
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="booking-payment">สถานะชำระเงิน</label>
          <select className="select" id="booking-payment" name="payment" defaultValue={payment}>
            {PAYMENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "ทุกสถานะ" : PAYMENT_STATUS_LABELS[option as PaymentStatus]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="booking-from">เช็คอินตั้งแต่</label>
          <input className="input" id="booking-from" type="date" name="from" defaultValue={from} />
        </div>
        <div className="field">
          <label htmlFor="booking-to">เช็คอินถึง</label>
          <input className="input" id="booking-to" type="date" name="to" defaultValue={to} />
        </div>
        <div className="admin-filter-actions">
          <button type="submit" className="btn btn-sm">
            <Filter size={13} /> กรองผลลัพธ์
          </button>
          <Link href="/admin/bookings" className="btn btn-ghost btn-sm">
            <RotateCcw size={13} /> ล้าง
          </Link>
        </div>
      </form>

      <section className="panel">
        <div className="admin-table-head">
          <div>
            <h2>รายการจอง</h2>
            <p>
              {search ? `ผลการค้นหา “${search}” · ` : ""}
              {status === "ALL" ? "ทุกสถานะ" : BOOKING_STATUS_LABELS[status as BookingStatus] ?? status}
              {from || to ? ` · ${from || "เริ่มต้น"} ถึง ${to || "ไม่มีกำหนด"}` : ""}
            </p>
          </div>
          <span className="text-tiny muted">อัปเดตล่าสุด {formatThaiDateTime(new Date().toISOString())}</span>
        </div>

        {bookings.length === 0 ? (
          <div className="admin-empty">
            <CalendarDays size={24} />
            <h3>ไม่พบรายการจอง</h3>
            <p>ลองเปลี่ยนตัวกรองหรือล้างเงื่อนไขการค้นหา แล้วลองอีกครั้ง</p>
            <Link href="/admin/bookings" className="btn btn-outline btn-sm">
              ล้างตัวกรอง
            </Link>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>การจอง</th>
                  <th>ผู้เข้าพัก</th>
                  <th>ห้องพัก</th>
                  <th>การเข้าพัก</th>
                  <th className="text-right">ยอดชำระ</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <span className="table-code">{booking.code}</span>
                      <span className="table-sub">{formatThaiDate(booking.created_at.slice(0, 10), "short")}</span>
                    </td>
                    <td>
                      <span className="table-strong">{booking.guest_name}</span>
                      <span className="table-sub">{booking.guest_email}</span>
                      <span className="table-sub">{booking.guest_phone}</span>
                    </td>
                    <td>
                      <span className="table-strong">{booking.room_name}</span>
                      <span className="table-sub">
                        {booking.room_code} · {booking.guests} ท่าน
                      </span>
                    </td>
                    <td>
                      <span className="table-strong">{formatDateRange(booking.check_in, booking.check_out)}</span>
                      <span className="table-sub">
                        {booking.nights} คืน
                        {booking.check_in <= todayISO() && booking.check_out > todayISO() ? " · กำลังพัก" : ""}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="table-strong">{formatTHB(booking.total)}</span>
                      <span className="table-sub">
                        <span className={`badge ${PAYMENT_STATUS_CLASS[booking.payment_status]}`}>
                          {PAYMENT_STATUS_LABELS[booking.payment_status]}
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${BOOKING_STATUS_CLASS[booking.status]}`}>
                        {BOOKING_STATUS_LABELS[booking.status]}
                      </span>
                      {booking.special_requests && (
                        <span className="table-note" title={booking.special_requests}>
                          หมายเหตุ: {booking.special_requests}
                        </span>
                      )}
                      {booking.cancel_reason && (
                        <span className="table-note danger" title={booking.cancel_reason}>
                          เหตุผล: {booking.cancel_reason}
                        </span>
                      )}
                    </td>
                    <td>
                      <BookingActions
                        bookingId={booking.id}
                        code={booking.code}
                        status={booking.status}
                        guestName={booking.guest_name}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
