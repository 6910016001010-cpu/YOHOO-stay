"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ImagePlus,
  LockKeyhole,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { useToast } from "./toast-provider";
import { formatTHB } from "@/lib/money";

interface PaymentFlowProps {
  bookingCode: string;
  total: number;
  bookingSummary: string;
}

export function PaymentFlow({ bookingCode, total, bookingSummary }: PaymentFlowProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [method, setMethod] = useState<"CARD" | "BANK_TRANSFER">("CARD");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [slipUrl, setSlipUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [doneMethod, setDoneMethod] = useState<"CARD" | "BANK_TRANSFER">("CARD");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function formatCard(value: string) {
    return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  }

  async function uploadFile(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      error("รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      error("ไฟล์ต้องมีขนาดไม่เกิน 5 MB");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "อัปโหลดไม่สำเร็จ");
      setSlipUrl(json.data.url);
      success("อัปโหลดหลักฐานการโอนเงินแล้ว");
    } catch (uploadError) {
      error((uploadError as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setFieldErrors({});
    try {
      const payload =
        method === "CARD"
          ? { method, bookingCode, cardName, cardNumber, expiry, cvv }
          : { method, bookingCode, slipUrl };
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        error(json.error ?? "ชำระเงินไม่สำเร็จ");
        return;
      }
      setDoneMethod(method);
      setDone(true);
      success(method === "CARD" ? "ชำระเงินสำเร็จ" : "ส่งหลักฐานการโอนเงินแล้ว");
      router.refresh();
    } catch {
      error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText("1234567890");
      success("คัดลอกเลขบัญชีแล้ว");
    } catch {
      error("ไม่สามารถคัดลอกได้");
    }
  }

  if (done) {
    return (
      <div className="payment-success">
        <div className="success-icon">
          <CheckCircle2 size={34} />
        </div>
        <h2>{doneMethod === "CARD" ? "ชำระเงินสำเร็จ" : "ได้รับหลักฐานการโอนแล้ว"}</h2>
        <p>
          {doneMethod === "CARD"
            ? "ระบบจำลองการชำระเงินได้บันทึกยอดชำระเรียบร้อยแล้ว การจองของคุณยังรอการอนุมัติจากทีมงาน"
            : "ทีมงานจะตรวจสอบหลักฐานการโอนเงินและยืนยันการจองของคุณโดยเร็วที่สุด"}
        </p>
        <div className="panel panel-pad" style={{ maxWidth: 420, margin: "22px auto 0", textAlign: "left" }}>
          <div className="price-line">
            <span className="muted">รหัสการจอง</span>
            <strong>{bookingCode}</strong>
          </div>
          <div className="price-line" style={{ marginTop: 8 }}>
            <span className="muted">ยอดชำระ</span>
            <strong>{formatTHB(total)}</strong>
          </div>
          <div className="price-line" style={{ marginTop: 8 }}>
            <span className="muted">สถานะการจอง</span>
            <span className="badge badge-pending">รออนุมัติ</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 9, flexWrap: "wrap" }}>
          <Link href="/account/bookings?paid=1" className="btn">
            ดูการจองของฉัน <ArrowRight size={15} />
          </Link>
          <Link href="/rooms" className="btn btn-outline">
            ค้นหาห้องอื่น
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="panel panel-pad" onSubmit={submit}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">Secure payment</span>
          <h2 className="panel-title" style={{ marginTop: 7 }}>
            เลือกวิธีชำระเงิน
          </h2>
        </div>
        <span className="badge badge-available">DEMO MODE</span>
      </div>

      <div className="info-banner warning">
        <ShieldCheck size={15} />
        <span>
          นี่คือระบบจำลองการชำระเงิน ไม่มีการตัดเงินจริง · การจองจะได้รับการยืนยันหลังแอดมินตรวจสอบ
        </span>
      </div>

      <div className="payment-methods">
        <button
          type="button"
          className={`payment-method ${method === "CARD" ? "active" : ""}`}
          onClick={() => setMethod("CARD")}
        >
          <span className="payment-method-icon">
            <CreditCard size={17} />
          </span>
          <span>
            <strong>บัตรเครดิต / เดบิต</strong>
            <span>จำลองการชำระเงินทันที</span>
          </span>
        </button>
        <button
          type="button"
          className={`payment-method ${method === "BANK_TRANSFER" ? "active" : ""}`}
          onClick={() => setMethod("BANK_TRANSFER")}
        >
          <span className="payment-method-icon">
            <Banknote size={17} />
          </span>
          <span>
            <strong>โอนเงินผ่านธนาคาร</strong>
            <span>แนบหลักฐานการโอน</span>
          </span>
        </button>
      </div>

      {method === "CARD" ? (
        <>
          <div className="mock-card">
            <div className="mock-card-top">
              <span className="mock-card-brand">YOHOO PAY</span>
              <span style={{ color: "rgba(255,255,255,.54)", fontSize: 9 }}>MOCK CARD</span>
            </div>
            <div className="mock-card-chip" />
            <div className="mock-card-number">{cardNumber || "•••• •••• •••• ••••"}</div>
            <div className="mock-card-meta">
              <div>
                Card holder
                <strong>{cardName || "ชื่อบนบัตร"}</strong>
              </div>
              <div>
                Expires
                <strong>{expiry || "MM/YY"}</strong>
              </div>
            </div>
          </div>

          <div className="form-grid">
            <div className="field field-full">
              <label htmlFor="cardName">ชื่อบนบัตร</label>
              <input
                className="input"
                id="cardName"
                value={cardName}
                onChange={(event) => setCardName(event.target.value)}
                placeholder="เช่น SOMCHAI JAIDEE"
                aria-invalid={Boolean(fieldErrors.cardName)}
                required
              />
              {fieldErrors.cardName && <span className="field-error">{fieldErrors.cardName[0]}</span>}
            </div>
            <div className="field field-full">
              <label htmlFor="cardNumber">หมายเลขบัตร</label>
              <div className="input-wrap">
                <CreditCard size={16} />
                <input
                  className="input"
                  id="cardNumber"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(event) => setCardNumber(formatCard(event.target.value))}
                  placeholder="4242 4242 4242 4242"
                  aria-invalid={Boolean(fieldErrors.cardNumber)}
                  required
                />
              </div>
              {fieldErrors.cardNumber && <span className="field-error">{fieldErrors.cardNumber[0]}</span>}
            </div>
            <div className="field">
              <label htmlFor="expiry">วันหมดอายุ</label>
              <input
                className="input"
                id="expiry"
                inputMode="numeric"
                value={expiry}
                onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                placeholder="MM/YY"
                aria-invalid={Boolean(fieldErrors.expiry)}
                required
              />
              {fieldErrors.expiry && <span className="field-error">{fieldErrors.expiry[0]}</span>}
            </div>
            <div className="field">
              <label htmlFor="cvv">CVV</label>
              <input
                className="input"
                id="cvv"
                inputMode="numeric"
                value={cvv}
                onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                aria-invalid={Boolean(fieldErrors.cvv)}
                required
              />
              {fieldErrors.cvv && <span className="field-error">{fieldErrors.cvv[0]}</span>}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="transfer-box">
            <p className="text-xs" style={{ fontWeight: 800, marginBottom: 6 }}>
              โอนเงินไปยังบัญชี
            </p>
            <div className="bank-row">
              <span>ธนาคาร</span>
              <strong>ธนาคารกสิกรไทย</strong>
            </div>
            <div className="bank-row">
              <span>ชื่อบัญชี</span>
              <strong>บริษัท ยุฮู สเตย์ จำกัด</strong>
            </div>
            <div className="bank-row">
              <span>เลขบัญชี</span>
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <strong style={{ fontFamily: "Manrope, monospace", letterSpacing: "0.08em" }}>123-4-56789-0</strong>
                <button type="button" className="btn btn-ghost btn-icon" style={{ width: 28, minHeight: 28 }} onClick={copyAccount} aria-label="คัดลอกเลขบัญชี">
                  <Copy size={12} />
                </button>
              </span>
            </div>
            <div className="bank-row">
              <span>ยอดที่ต้องโอน</span>
              <strong style={{ color: "var(--forest)", fontSize: 15 }}>{formatTHB(total)}</strong>
            </div>
          </div>

          {!slipUrl ? (
            <label
              className={`upload-zone ${dragging ? "dragging" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) uploadFile(file);
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadFile(file);
                }}
              />
              {uploading ? (
                <>
                  <span className="spinner" style={{ color: "var(--forest)" }} />
                  <strong>กำลังอัปโหลด...</strong>
                </>
              ) : (
                <>
                  <UploadCloud size={27} style={{ color: "var(--forest-soft)" }} />
                  <strong>ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</strong>
                  <span>JPG, PNG, WEBP · ไม่เกิน 5 MB</span>
                </>
              )}
            </label>
          ) : (
            <div className="upload-preview">
              <img src={slipUrl} alt="หลักฐานการโอนเงิน" />
              <button
                type="button"
                className="btn btn-danger btn-icon btn-sm"
                aria-label="ลบรูป"
                onClick={() => {
                  setSlipUrl("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                <X size={13} />
              </button>
            </div>
          )}
          {fieldErrors.slipUrl && <span className="field-error">{fieldErrors.slipUrl[0]}</span>}
          <div className="info-banner info" style={{ marginTop: 14, marginBottom: 0 }}>
            <ImagePlus size={15} />
            <span>หลักฐานจะถูกส่งให้ทีมงานตรวจสอบ · โดยปกติใช้เวลาภายใน 1 วันทำการ</span>
          </div>
        </>
      )}

      <button className="btn btn-block btn-lg" type="submit" style={{ marginTop: 20 }} disabled={loading || uploading || (method === "BANK_TRANSFER" && !slipUrl)}>
        {loading ? <span className="spinner" /> : <Check size={16} />}
        {method === "CARD" ? `ชำระเงิน ${formatTHB(total)}` : "ส่งหลักฐานการโอนเงิน"}
      </button>
      <p className="secure-note">
        <LockKeyhole size={11} /> ข้อมูลของคุณถูกเข้ารหัสและไม่ถูกเปิดเผยต่อบุคคลที่สาม
      </p>
      <p className="widget-note">
        การจอง: {bookingCode} · {bookingSummary}
      </p>
    </form>
  );
}
