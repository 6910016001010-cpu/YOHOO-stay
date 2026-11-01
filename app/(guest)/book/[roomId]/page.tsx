import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, ShieldCheck, UsersRound } from "lucide-react";
import { BookingForm } from "@/components/booking-form";
import { requireUser } from "@/lib/auth";
import { getRoomById, isRoomAvailable } from "@/lib/rooms";
import { addDays, diffDays, formatDateRange, isValidISODate, todayISO } from "@/lib/date";
import { calculatePrice, formatTHB } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata = { title: "ยืนยันการจอง" };

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
}) {
  const { roomId } = await params;
  const sp = await searchParams;
  const today = todayISO();
  let checkIn = sp.checkIn && isValidISODate(sp.checkIn) ? sp.checkIn : addDays(today, 1);
  let checkOut = sp.checkOut && isValidISODate(sp.checkOut) ? sp.checkOut : addDays(checkIn, 1);
  if (checkIn < today) checkIn = today;
  if (checkOut <= checkIn) checkOut = addDays(checkIn, 1);
  const query = new URLSearchParams({ checkIn, checkOut, guests: sp.guests ?? "2" }).toString();
  const user = await requireUser(`/book/${roomId}?${query}`);

  const room = getRoomById(roomId);
  if (!room) notFound();
  const guests = Math.min(room.capacity, Math.max(1, Number(sp.guests) || 2));
  const nights = diffDays(checkIn, checkOut);
  const available = room.status === "AVAILABLE" && isRoomAvailable(room.id, checkIn, checkOut);

  if (!available) {
    return (
      <div className="page-shell">
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="empty-state">
            <span className="empty-icon">
              <CalendarDays size={25} />
            </span>
            <h3>ห้องนี้ไม่ว่างในช่วงวันที่เลือก</h3>
            <p>อาจมีผู้จองห้องนี้ไปแล้วระหว่างที่คุณกำลังดำเนินการ กรุณาเลือกช่วงวันที่ใหม่หรือเลือกห้องอื่น</p>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <Link href={`/rooms/${room.slug}`} className="btn btn-outline">
                ดูห้องนี้
              </Link>
              <Link href={`/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`} className="btn">
                ค้นหาห้องว่าง
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (nights > 30) redirect(`/rooms/${room.slug}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  const pricing = calculatePrice(room.price_per_night, nights);

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 1040 }}>
        <nav className="breadcrumbs">
          <Link href="/">หน้าแรก</Link>
          <span>/</span>
          <Link href={`/rooms/${room.slug}`}>ห้อง {room.name}</Link>
          <span>/</span>
          <span>ยืนยันการจอง</span>
        </nav>

        <div className="page-head">
          <div>
            <span className="eyebrow">Almost there</span>
            <h1 className="page-title">อีกหนึ่งขั้นสู่วันหยุดของคุณ</h1>
            <p className="page-subtitle">ตรวจสอบรายละเอียดและกรอกข้อมูลผู้เข้าพักให้ครบถ้วน</p>
          </div>
          <Link href={`/rooms/${room.slug}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`} className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} /> กลับไปเลือกวันที่
          </Link>
        </div>

        <div className="step-indicator">
          <span className="step done">
            <span className="step-num">✓</span> เลือกห้อง
          </span>
          <span className="step-line" />
          <span className="step active">
            <span className="step-num">2</span> ข้อมูลการจอง
          </span>
          <span className="step-line" />
          <span className="step">
            <span className="step-num">3</span> ชำระเงิน
          </span>
        </div>

        <div className="checkout-layout">
          <BookingForm
            roomId={room.id}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            capacity={room.capacity}
            user={user}
            total={pricing.total}
          />

          <aside className="summary-card">
            <div className="summary-image">
              <img src={room.images[0]?.url} alt={room.name} />
              <span className="badge badge-available">ห้องว่าง</span>
            </div>
            <div className="summary-body">
              <h2 className="summary-room-name">{room.name}</h2>
              <div className="summary-meta">
                <span>{room.type_name}</span>
                <span>·</span>
                <span>{room.code}</span>
                <span>·</span>
                <span>{room.size_sqm} ตร.ม.</span>
              </div>

              <div className="summary-dates">
                <div>
                  <p className="summary-date-label">เช็คอิน</p>
                  <p className="summary-date-value">{formatDateRange(checkIn, checkOut).split(" – ")[0]}</p>
                </div>
                <span className="summary-night">{nights} คืน</span>
                <div style={{ textAlign: "right" }}>
                  <p className="summary-date-label">เช็คเอาต์</p>
                  <p className="summary-date-value">{formatDateRange(checkIn, checkOut).split(" – ")[1]}</p>
                </div>
              </div>

              <div className="summary-meta" style={{ marginTop: 13 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <UsersRound size={12} /> {guests} ท่าน
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <CalendarDays size={12} /> {nights} คืน
                </span>
              </div>

              <div className="summary-price-lines">
                <div className="price-line">
                  <span>
                    {formatTHB(room.price_per_night)} × {nights} คืน
                  </span>
                  <span>{formatTHB(pricing.subtotal)}</span>
                </div>
                <div className="price-line">
                  <span>ค่าบริการ 10%</span>
                  <span>{formatTHB(pricing.serviceFee)}</span>
                </div>
                <div className="price-line">
                  <span>VAT 7%</span>
                  <span>{formatTHB(pricing.tax)}</span>
                </div>
              </div>

              <div className="summary-total">
                <span>ยอดรวมทั้งสิ้น</span>
                <strong>{formatTHB(pricing.total)}</strong>
              </div>

              <div className="summary-assurance">
                <ShieldCheck size={14} />
                <span>ราคานี้ถูกล็อกไว้ตลอดขั้นตอนการจอง · ยกเลิกฟรีล่วงหน้า 48 ชั่วโมง</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
