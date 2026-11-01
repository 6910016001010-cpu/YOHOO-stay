import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  History,
  MapPin,
  Plus,
  ReceiptText,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getBookingsForUser } from "@/lib/bookings";
import { formatDateRange, formatThaiDate, todayISO } from "@/lib/date";
import { formatTHB } from "@/lib/money";
import {
  BOOKING_FLOW,
  BOOKING_STATUS_CLASS,
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_CLASS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/status";
import { CancelBookingButton } from "@/components/cancel-booking-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "การจองของฉัน" };

export default async function AccountBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireUser("/account/bookings");
  const bookings = getBookingsForUser(user.id);
  const today = todayISO();
  const active = bookings.filter((booking) => ["PENDING", "CONFIRMED", "CHECKED_IN"].includes(booking.status));
  const completed = bookings.filter((booking) => booking.status === "CHECKED_OUT");
  const totalSpent = bookings
    .filter((booking) => booking.payment_status === "PAID")
    .reduce((total, booking) => total + booking.total, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">My journey</span>
          <h1 className="page-title">การจองของฉัน</h1>
          <p className="page-subtitle">
            สวัสดี {user.name.split(" ")[0]} · ติดตามสถานะ ตรวจสอบรายละเอียด และจัดการการเข้าพักของคุณได้ที่นี่
          </p>
        </div>
        <Link href="/rooms" className="btn">
          <Plus size={15} /> จองห้องใหม่
        </Link>
      </div>

      {sp.error === "forbidden" && (
        <div className="info-banner" style={{ marginBottom: 20, background: "var(--danger-soft)", borderColor: "#f0cbc4", color: "var(--danger)" }}>
          <ShieldAlert size={15} />
          <span>บัญชีนี้ไม่มีสิทธิ์เข้าถึงหน้าผู้ดูแลระบบ กรุณาใช้อีเมลผู้ดูแลระบบหากต้องการจัดการข้อมูล</span>
        </div>
      )}

      <div className="account-stats">
        <div className="account-stat">
          <span>การจองที่กำลังจะมาถึง</span>
          <strong>{active.length}</strong>
          <p className="text-tiny muted" style={{ marginTop: 2 }}>
            <CalendarCheck2 size={11} style={{ display: "inline", marginRight: 3 }} />
            รวมรายการรออนุมัติ
          </p>
        </div>
        <div className="account-stat">
          <span>เข้าพักแล้ว</span>
          <strong>{completed.length}</strong>
          <p className="text-tiny muted" style={{ marginTop: 2 }}>
            <History size={11} style={{ display: "inline", marginRight: 3 }} />
            ประวัติทั้งหมด
          </p>
        </div>
        <div className="account-stat">
          <span>ยอดชำระสะสม</span>
          <strong style={{ fontSize: 19 }}>{formatTHB(totalSpent)}</strong>
          <p className="text-tiny muted" style={{ marginTop: 2 }}>
            <ReceiptText size={11} style={{ display: "inline", marginRight: 3 }} />
            เฉพาะที่ชำระแล้ว
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <CalendarDays size={25} />
          </span>
          <h3>ยังไม่มีการจอง</h3>
          <p>เริ่มวางแผนวันหยุดของคุณกับห้องพักที่ออกแบบมาเพื่อการพักผ่อนโดยเฉพาะ</p>
          <Link href="/rooms" className="btn">
            ค้นหาห้องว่าง <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="booking-history">
          {bookings.map((booking) => {
            const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status) && booking.check_in >= today;
            const canPay = ["UNPAID", "FAILED"].includes(booking.payment_status) && ["PENDING", "CONFIRMED"].includes(booking.status);
            const currentIndex = BOOKING_FLOW.indexOf(booking.status);
            const isCancelled = ["CANCELLED", "REJECTED"].includes(booking.status);

            return (
              <article className="booking-item" key={booking.id}>
                <div className="booking-item-head">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span className="booking-code">{booking.code}</span>
                    <span className={`badge ${BOOKING_STATUS_CLASS[booking.status]}`}>{BOOKING_STATUS_LABELS[booking.status]}</span>
                    <span className={`badge ${PAYMENT_STATUS_CLASS[booking.payment_status]}`}>
                      {PAYMENT_STATUS_LABELS[booking.payment_status]}
                    </span>
                  </div>
                  <span className="text-tiny muted">จองเมื่อ {formatThaiDate(booking.created_at.slice(0, 10), "short")}</span>
                </div>

                <div className="booking-item-body">
                  <Link className="booking-item-img" href={`/rooms/${booking.room_slug}`}>
                    <img src={booking.room_image ?? "/images/room-standard.webp"} alt={booking.room_name} />
                  </Link>
                  <div className="booking-item-info">
                    <h3>{booking.room_name}</h3>
                    <div className="booking-item-meta">
                      <span>
                        <CalendarDays size={12} /> {formatDateRange(booking.check_in, booking.check_out)}
                      </span>
                      <span>
                        <UsersRound size={12} /> {booking.guests} ท่าน · {booking.nights} คืน
                      </span>
                      <span>
                        <MapPin size={12} /> {booking.room_code}
                      </span>
                    </div>

                    {!isCancelled ? (
                      <div className="booking-track" aria-label="สถานะการเข้าพัก">
                        {BOOKING_FLOW.map((status, index) => (
                          <span
                            key={status}
                            className={`track-step ${index <= currentIndex ? "done" : ""}`}
                            style={{ flex: index === BOOKING_FLOW.length - 1 ? "0 0 auto" : undefined }}
                          >
                            <span className="track-dot">{index <= currentIndex ? <Check size={5} color="white" /> : null}</span>
                            <span>{BOOKING_STATUS_LABELS[status]}</span>
                            {index < BOOKING_FLOW.length - 1 && <span className="track-line" />}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="booking-cancelled-note">
                        {booking.status === "CANCELLED" ? "ยกเลิกแล้ว" : "ถูกปฏิเสธ"}
                        {booking.cancel_reason ? ` · ${booking.cancel_reason}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="booking-item-side">
                    <div>
                      <p className="booking-item-total">{formatTHB(booking.total)}</p>
                      <p className="text-tiny muted">{booking.payment_status === "PAID" ? "ชำระครบแล้ว" : "ยอดรวมทั้งสิ้น"}</p>
                    </div>
                    <div className="booking-item-actions">
                      {canPay && (
                        <Link href={`/checkout/${booking.code}`} className="btn btn-sm">
                          <CircleDollarSign size={13} /> ชำระเงิน
                        </Link>
                      )}
                      {booking.payment_status === "PENDING_REVIEW" && (
                        <Link href={`/checkout/${booking.code}`} className="btn btn-outline btn-sm">
                          <Clock3 size={13} /> รอตรวจสอบ
                        </Link>
                      )}
                      {booking.payment_status === "PAID" && (
                        <Link href={`/checkout/${booking.code}`} className="btn btn-ghost btn-sm">
                          ดูใบยืนยัน
                        </Link>
                      )}
                      {canCancel && <CancelBookingButton code={booking.code} roomName={booking.room_name} />}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
