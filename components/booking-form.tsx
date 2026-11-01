"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, LockKeyhole } from "lucide-react";
import { useToast } from "./toast-provider";
import type { User } from "@/lib/types";

interface BookingFormProps {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  capacity: number;
  user: User;
  total: number;
}

export function BookingForm({ roomId, checkIn, checkOut, guests, capacity, user, total }: BookingFormProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted) {
      error("กรุณายอมรับเงื่อนไขการจองก่อนดำเนินการ");
      return;
    }
    setLoading(true);
    setFormError(null);
    setFieldErrors({});
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          checkIn,
          checkOut,
          guests,
          guestName: form.get("guestName"),
          guestEmail: form.get("guestEmail"),
          guestPhone: form.get("guestPhone"),
          specialRequests: form.get("specialRequests"),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        setFormError(json.error ?? "ไม่สามารถสร้างการจองได้");
        error(json.error ?? "ไม่สามารถสร้างการจองได้");
        return;
      }
      success("สร้างรายการจองสำเร็จ! กรุณาชำระเงินเพื่อยืนยัน");
      router.push(`/checkout/${json.data.code}`);
    } catch {
      setFormError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่");
      error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const err = (name: string) => fieldErrors[name]?.[0];

  return (
    <form className="panel panel-pad" onSubmit={submit} noValidate>
      {formError && (
        <div className="info-banner" style={{ background: "var(--danger-soft)", borderColor: "#f0cbc4", color: "var(--danger)" }}>
          <AlertCircle size={15} />
          <span>{formError}</span>
        </div>
      )}

      <div className="panel-head">
        <div>
          <span className="eyebrow">Guest details</span>
          <h2 className="panel-title" style={{ marginTop: 7 }}>
            ข้อมูลผู้เข้าพัก
          </h2>
        </div>
        <span className="badge badge-confirmed">{guests} ท่าน</span>
      </div>

      <div className="form-grid">
        <div className="field field-full">
          <label htmlFor="guestName">ชื่อ-นามสกุลผู้เข้าพัก *</label>
          <input className="input" id="guestName" name="guestName" defaultValue={user.name} required minLength={2} aria-invalid={Boolean(err("guestName"))} />
          {err("guestName") && <span className="field-error">{err("guestName")}</span>}
        </div>
        <div className="field">
          <label htmlFor="guestEmail">อีเมล *</label>
          <input className="input" id="guestEmail" name="guestEmail" type="email" defaultValue={user.email} required aria-invalid={Boolean(err("guestEmail"))} />
          {err("guestEmail") && <span className="field-error">{err("guestEmail")}</span>}
        </div>
        <div className="field">
          <label htmlFor="guestPhone">เบอร์โทรศัพท์ *</label>
          <input
            className="input"
            id="guestPhone"
            name="guestPhone"
            type="tel"
            defaultValue={user.phone ?? ""}
            placeholder="08X-XXX-XXXX"
            required
            aria-invalid={Boolean(err("guestPhone"))}
          />
          {err("guestPhone") && <span className="field-error">{err("guestPhone")}</span>}
        </div>
        <div className="field field-full">
          <label htmlFor="specialRequests">คำขอพิเศษ (ถ้ามี)</label>
          <textarea
            className="textarea"
            id="specialRequests"
            name="specialRequests"
            placeholder="เช่น ต้องการเตียงเสริม, แจ้งเวลาถึงโดยประมาณ, ฉลองโอกาสพิเศษ..."
            maxLength={500}
          />
          <span className="field-hint">ทีมงานจะพยายามจัดเตรียมให้ตามความเหมาะสม แต่ไม่สามารถรับประกันได้ทุกกรณี</span>
        </div>
      </div>

      <hr className="divider" />

      <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <div className="field">
          <span className="field-label">ช่วงวันที่เข้าพัก</span>
          <div className="widget-dates" style={{ background: "var(--cream)" }}>
            <div className="widget-date">
              <label>เช็คอิน</label>
              <strong style={{ fontSize: 12 }}>{checkIn}</strong>
            </div>
            <div className="widget-date">
              <label>เช็คเอาต์</label>
              <strong style={{ fontSize: 12 }}>{checkOut}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="info-banner info" style={{ marginTop: 20, marginBottom: 0 }}>
        <LockKeyhole size={15} />
        <span>
          ข้อมูลของคุณถูกใช้เพื่อยืนยันการเข้าพักเท่านั้น · ระบบจะยังไม่เรียกเก็บเงินจนกว่าคุณจะเลือกวิธีชำระเงินในขั้นตอนถัดไป
        </span>
      </div>

      <label className="checkbox-row" style={{ marginTop: 17 }}>
        <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
        <span>
          ฉันได้อ่านและยอมรับเงื่อนไขการจอง นโยบายการยกเลิก และนโยบายความเป็นส่วนตัวของ YOHOO
          และยืนยันว่าข้อมูลผู้เข้าพักถูกต้อง
        </span>
      </label>

      <button className="btn btn-block btn-lg" style={{ marginTop: 20 }} type="submit" disabled={loading || !accepted}>
        {loading ? <span className="spinner" /> : null}
        ยืนยันการจอง · {new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(total)}
        {!loading && <ArrowRight size={16} />}
      </button>
      <p className="widget-note">ขั้นตอนถัดไป: เลือกวิธีชำระเงิน · ยังไม่มีการตัดเงินจริง</p>
    </form>
  );
}
