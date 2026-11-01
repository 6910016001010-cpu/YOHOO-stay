"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Loader2, ShieldCheck, TriangleAlert, UsersRound } from "lucide-react";
import { addDays, diffDays, formatThaiDate, todayISO } from "@/lib/date";
import { calculatePrice, formatTHB } from "@/lib/money";

interface BookingWidgetProps {
  roomId: string;
  roomSlug: string;
  pricePerNight: number;
  capacity: number;
  initialCheckIn: string;
  initialCheckOut: string;
  initialGuests: number;
  roomAvailable: boolean;
  roomStatus: string;
}

export function BookingWidget({
  roomId,
  roomSlug,
  pricePerNight,
  capacity,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  roomAvailable,
  roomStatus,
}: BookingWidgetProps) {
  const router = useRouter();
  const today = todayISO();
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(Math.min(initialGuests, capacity));
  const [available, setAvailable] = useState(roomAvailable);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nights = Math.max(0, diffDays(checkIn, checkOut));
  const pricing = useMemo(() => calculatePrice(pricePerNight, nights), [pricePerNight, nights]);
  const validDates = checkIn >= today && checkOut > checkIn;

  useEffect(() => {
    if (!validDates) {
      setAvailable(false);
      setMessage("กรุณาเลือกช่วงวันที่ถูกต้อง");
      return;
    }
    const controller = new AbortController();
    setChecking(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/rooms/${roomId}/availability?checkIn=${checkIn}&checkOut=${checkOut}`,
          { signal: controller.signal },
        );
        const json = await response.json();
        if (json.ok) {
          setAvailable(json.data.available);
          setMessage(json.data.reason ?? null);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setAvailable(false);
          setMessage("ไม่สามารถตรวจสอบห้องว่างได้ กรุณาลองใหม่");
        }
      } finally {
        setChecking(false);
      }
    }, 350);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [roomId, checkIn, checkOut, validDates]);

  function changeCheckIn(value: string) {
    setCheckIn(value);
    if (value >= checkOut) setCheckOut(addDays(value, 1));
  }

  function book() {
    if (!available || !validDates) return;
    setSubmitting(true);
    router.push(`/book/${roomId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  }

  const disabled = !available || !validDates || checking || roomStatus !== "AVAILABLE";

  return (
    <div className="booking-widget">
      <div className="booking-widget-head">
        <div>
          <div className="booking-widget-price">
            {formatTHB(pricePerNight)} <small>/ คืน</small>
          </div>
          <p className="text-tiny muted" style={{ marginTop: 3 }}>
            ราคารวมอาหารเช้า · ยังไม่รวมภาษี
          </p>
        </div>
        <span className="badge badge-available">จองได้</span>
      </div>

      <div className="widget-dates">
        <div className="widget-date">
          <label htmlFor="detail-checkin">
            <CalendarDays size={10} style={{ display: "inline", marginRight: 3 }} />
            เช็คอิน
          </label>
          <input
            id="detail-checkin"
            type="date"
            min={today}
            value={checkIn}
            onChange={(event) => changeCheckIn(event.target.value)}
          />
        </div>
        <div className="widget-date">
          <label htmlFor="detail-checkout">
            <CalendarDays size={10} style={{ display: "inline", marginRight: 3 }} />
            เช็คเอาต์
          </label>
          <input
            id="detail-checkout"
            type="date"
            min={addDays(checkIn, 1)}
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
          />
        </div>
      </div>

      <div className="widget-guests">
        <label htmlFor="detail-guests">
          <UsersRound size={12} style={{ display: "inline", verticalAlign: "-2px", marginRight: 5 }} />
          ผู้เข้าพัก
        </label>
        <select id="detail-guests" value={guests} onChange={(event) => setGuests(Number(event.target.value))}>
          {Array.from({ length: capacity }, (_, index) => index + 1).map((count) => (
            <option key={count} value={count}>
              {count} ท่าน
            </option>
          ))}
        </select>
      </div>

      <div className={`availability-status ${checking ? "" : available && validDates ? "ok" : "bad"}`} aria-live="polite">
        {checking ? (
          <>
            <Loader2 size={12} className="spin" /> กำลังตรวจสอบห้องว่าง...
          </>
        ) : available && validDates ? (
          <>
            <CheckCircle2 size={12} /> ห้องว่างสำหรับ {formatThaiDate(checkIn, "short")} – {formatThaiDate(checkOut, "short")}
          </>
        ) : (
          <>
            <TriangleAlert size={12} /> {message ?? "ห้องไม่ว่างในช่วงวันที่เลือก"}
          </>
        )}
      </div>

      {nights > 0 && (
        <div className="price-lines">
          <div className="price-line">
            <span>
              {formatTHB(pricePerNight)} × {nights} คืน
            </span>
            <span>{formatTHB(pricing.subtotal)}</span>
          </div>
          <div className="price-line">
            <span>ค่าบริการ (10%)</span>
            <span>{formatTHB(pricing.serviceFee)}</span>
          </div>
          <div className="price-line">
            <span>VAT (7%)</span>
            <span>{formatTHB(pricing.tax)}</span>
          </div>
          <div className="price-line total">
            <span>รวมทั้งหมด</span>
            <span>{formatTHB(pricing.total)}</span>
          </div>
        </div>
      )}

      <button className="btn btn-block btn-lg" type="button" onClick={book} disabled={disabled || submitting}>
        {submitting ? <span className="spinner" /> : null}
        จองห้องนี้
      </button>
      <p className="widget-note">
        <ShieldCheck size={10} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} />
        ยังไม่มีการเรียกเก็บเงินในขั้นตอนนี้ · ยกเลิกฟรีล่วงหน้า 48 ชั่วโมง
      </p>
    </div>
  );
}
