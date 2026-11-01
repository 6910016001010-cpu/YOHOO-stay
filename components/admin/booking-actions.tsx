"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, DoorOpen, LogIn, X } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import type { BookingStatus } from "@/lib/types";

interface BookingActionsProps {
  bookingId: string;
  code: string;
  status: BookingStatus;
  guestName: string;
}

export function BookingActions({ bookingId, code, status, guestName }: BookingActionsProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");

  async function update(nextStatus: BookingStatus, message: string, rejectNote = "") {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, note: rejectNote }),
      });
      const json = await response.json();
      if (!response.ok) {
        error(json.error ?? "ไม่สามารถเปลี่ยนสถานะการจองได้");
        return;
      }
      success(message);
      setRejectOpen(false);
      setNote("");
      router.refresh();
    } catch {
      error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="table-actions">
      {status === "PENDING" && (
        <>
          <button
            type="button"
            className="btn btn-sm btn-lime"
            disabled={loading}
            onClick={() => update("CONFIRMED", `อนุมัติการจอง ${code} แล้ว`)}
          >
            {loading ? <span className="spinner" /> : <Check size={13} />}
            อนุมัติ
          </button>
          <button type="button" className="btn btn-sm btn-danger-soft" disabled={loading} onClick={() => setRejectOpen(true)}>
            <X size={13} /> ปฏิเสธ
          </button>
        </>
      )}

      {status === "CONFIRMED" && (
        <>
          <button
            type="button"
            className="btn btn-sm"
            disabled={loading}
            onClick={() => update("CHECKED_IN", `เช็คอินการจอง ${code} แล้ว`)}
          >
            {loading ? <span className="spinner" /> : <LogIn size={13} />}
            เช็คอิน
          </button>
          <button type="button" className="btn btn-sm btn-danger-soft" disabled={loading} onClick={() => setRejectOpen(true)}>
            <X size={13} /> ปฏิเสธ
          </button>
        </>
      )}

      {status === "CHECKED_IN" && (
        <button
          type="button"
          className="btn btn-sm"
          disabled={loading}
          onClick={() => update("CHECKED_OUT", `เช็คเอาต์การจอง ${code} แล้ว`)}
        >
          {loading ? <span className="spinner" /> : <DoorOpen size={13} />}
          เช็คเอาต์
        </button>
      )}

      {!["PENDING", "CONFIRMED", "CHECKED_IN"].includes(status) && <span className="text-tiny muted">ไม่มีการดำเนินการ</span>}

      {rejectOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && !loading && setRejectOpen(false)}
        >
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="reject-dialog-title">
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              style={{ float: "right", width: 34, minHeight: 34 }}
              onClick={() => setRejectOpen(false)}
              aria-label="ปิด"
              disabled={loading}
            >
              <X size={15} />
            </button>
            <div className="dialog-icon">
              <AlertTriangle size={21} />
            </div>
            <h3 id="reject-dialog-title">ปฏิเสธการจองนี้?</h3>
            <p>
              การจอง {code} ของ {guestName} จะถูกปฏิเสธ และหากชำระเงินแล้ว ระบบจะบันทึกสถานะคืนเงินให้ทีมงาน
            </p>
            <div className="field" style={{ marginTop: 16 }}>
              <label htmlFor="reject-note">เหตุผล (ไม่บังคับ)</label>
              <textarea
                className="textarea"
                id="reject-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="เช่น ห้องไม่ว่างช่วงวันที่เลือก..."
                maxLength={300}
                style={{ minHeight: 80 }}
              />
            </div>
            <div className="dialog-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setRejectOpen(false)} disabled={loading}>
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => update("REJECTED", `ปฏิเสธการจอง ${code} แล้ว`, note)}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : null}
                ยืนยันปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
