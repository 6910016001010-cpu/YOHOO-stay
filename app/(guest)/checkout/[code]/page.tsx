import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock3, ShieldCheck, UsersRound, XCircle } from "lucide-react";
import { PaymentFlow } from "@/components/payment-flow";
import { requireUser } from "@/lib/auth";
import { getBookingByCode, getBookingPayments } from "@/lib/bookings";
import { formatDateRange } from "@/lib/date";
import { formatTHB } from "@/lib/money";
import { BOOKING_STATUS_CLASS, BOOKING_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/status";

export const dynamic = "force-dynamic";

export const metadata = { title: "ชำระเงิน" };

export default async function CheckoutPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await requireUser(`/checkout/${code}`);
  const booking = getBookingByCode(code);
  if (!booking || booking.user_id !== user.id) notFound();
  const payments = getBookingPayments(booking.id);
  const latest = payments[0];
  const blocked = booking.status === "CANCELLED" || booking.status === "REJECTED";
  const paid = booking.payment_status === "PAID";
  const waiting = booking.payment_status === "PENDING_REVIEW";

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 1040 }}>
        <nav className="breadcrumbs">
          <Link href="/">หน้าแรก</Link>
          <span>/</span>
          <Link href="/account/bookings">การจองของฉัน</Link>
          <span>/</span>
          <span>ชำระเงิน</span>
        </nav>

        <div className="page-head">
          <div>
            <span className="eyebrow">Payment</span>
            <h1 className="page-title">ชำระเงินสำหรับการเข้าพัก</h1>
            <p className="page-subtitle">
              รหัสการจอง <strong>{booking.code}</strong> · {formatDateRange(booking.check_in, booking.check_out)}
            </p>
          </div>
          <Link href="/account/bookings" className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} /> กลับประวัติการจอง
          </Link>
        </div>

        <div className="step-indicator">
          <span className="step done">
            <span className="step-num">✓</span> เลือกห้อง
          </span>
          <span className="step-line" />
          <span className="step done">
            <span className="step-num">✓</span> ข้อมูลการจอง
          </span>
          <span className="step-line" />
          <span className="step active">
            <span className="step-num">3</span> ชำระเงิน
          </span>
        </div>

        <div className="checkout-layout">
          <div>
            {blocked ? (
              <div className="payment-success">
                <div className="success-icon" style={{ background: "var(--danger-soft)", color: "var(--danger)", boxShadow: "0 0 0 10px #fae8e4" }}>
                  <XCircle size={32} />
                </div>
                <h2>รายการจองนี้ไม่สามารถชำระเงินได้</h2>
                <p>สถานะการจองคือ “{BOOKING_STATUS_LABELS[booking.status]}” · หากต้องการความช่วยเหลือกรุณาติดต่อทีมงาน</p>
                <Link href="/account/bookings" className="btn">
                  ดูการจองทั้งหมด
                </Link>
              </div>
            ) : paid ? (
              <div className="payment-success">
                <div className="success-icon">
                  <CheckCircle2 size={34} />
                </div>
                <h2>ชำระเงินเรียบร้อยแล้ว</h2>
                <p>
                  เราได้รับยอดชำระ {formatTHB(booking.total)} สำหรับการจอง {booking.code} แล้ว
                  {latest ? ` · ช่องทาง ${PAYMENT_METHOD_LABELS[latest.method]} · เลขอ้างอิง ${latest.reference}` : ""}
                </p>
                <div className="info-banner info" style={{ maxWidth: 450, margin: "20px auto 0", textAlign: "left" }}>
                  <Clock3 size={15} />
                  <span>
                    สถานะการจองปัจจุบัน: {BOOKING_STATUS_LABELS[booking.status]} · ทีมงานจะยืนยันการเข้าพักให้เร็วที่สุด
                  </span>
                </div>
                <Link href="/account/bookings" className="btn">
                  ดูสถานะการจอง <ArrowRight size={15} />
                </Link>
              </div>
            ) : waiting ? (
              <div className="payment-success">
                <div className="success-icon" style={{ background: "var(--amber-soft)", color: "var(--amber)", boxShadow: "0 0 0 10px #fbf1d8" }}>
                  <Clock3 size={32} />
                </div>
                <h2>อยู่ระหว่างตรวจสอบการชำระเงิน</h2>
                <p>
                  เราได้รับหลักฐานการโอนเงินของคุณแล้ว ทีมงานจะตรวจสอบและยืนยันการจองภายใน 1 วันทำการ
                  {latest ? ` · เลขอ้างอิง ${latest.reference}` : ""}
                </p>
                <Link href="/account/bookings" className="btn">
                  ติดตามสถานะ <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <>
                {booking.payment_status === "FAILED" && (
                  <div className="info-banner" style={{ background: "var(--danger-soft)", borderColor: "#f0cbc4", color: "var(--danger)" }}>
                    <XCircle size={15} />
                    <span>การชำระเงินครั้งก่อนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</span>
                  </div>
                )}
                <PaymentFlow
                  bookingCode={booking.code}
                  total={booking.total}
                  bookingSummary={`${booking.room_name} · ${booking.nights} คืน · ${booking.guests} ท่าน`}
                />
              </>
            )}
          </div>

          <aside className="summary-card">
            <div className="summary-image">
              <img src={booking.room_image ?? "/images/room-standard.webp"} alt={booking.room_name} />
              <span className={`badge ${BOOKING_STATUS_CLASS[booking.status]}`}>{BOOKING_STATUS_LABELS[booking.status]}</span>
            </div>
            <div className="summary-body">
              <h2 className="summary-room-name">{booking.room_name}</h2>
              <div className="summary-meta">
                <span>{booking.room_code}</span>
                <span>·</span>
                <span>{booking.room_slug.replaceAll("-", " ")}</span>
              </div>

              <div className="summary-dates">
                <div>
                  <p className="summary-date-label">เช็คอิน</p>
                  <p className="summary-date-value">{formatDateRange(booking.check_in, booking.check_out).split(" – ")[0]}</p>
                </div>
                <span className="summary-night">{booking.nights} คืน</span>
                <div style={{ textAlign: "right" }}>
                  <p className="summary-date-label">เช็คเอาต์</p>
                  <p className="summary-date-value">{formatDateRange(booking.check_in, booking.check_out).split(" – ")[1]}</p>
                </div>
              </div>

              <div className="summary-meta" style={{ marginTop: 13 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <UsersRound size={12} /> {booking.guests} ท่าน
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <CalendarDays size={12} /> ผู้เข้าพัก {booking.guest_name}
                </span>
              </div>

              <div className="summary-price-lines">
                <div className="price-line">
                  <span>ค่าห้อง ({booking.nights} คืน)</span>
                  <span>{formatTHB(booking.subtotal)}</span>
                </div>
                <div className="price-line">
                  <span>ค่าบริการ 10%</span>
                  <span>{formatTHB(booking.service_fee)}</span>
                </div>
                <div className="price-line">
                  <span>VAT 7%</span>
                  <span>{formatTHB(booking.tax)}</span>
                </div>
              </div>
              <div className="summary-total">
                <span>ยอดชำระทั้งสิ้น</span>
                <strong>{formatTHB(booking.total)}</strong>
              </div>
              <div className="summary-assurance">
                <ShieldCheck size={14} />
                <span>ชำระผ่านระบบที่ปลอดภัย · ข้อมูลบัตรไม่ถูกจัดเก็บในระบบ</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
