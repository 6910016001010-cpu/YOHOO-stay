"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { useToast } from "./toast-provider";

export function CancelBookingButton({ code, roomName }: { code: string; roomName: string }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/${code}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await response.json();
      if (!response.ok) {
        error(json.error ?? "ไม่สามารถยกเลิกการจองได้");
        return;
      }
      success("ยกเลิกการจองเรียบร้อยแล้ว");
      setOpen(false);
      router.refresh();
    } catch {
      error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        ขอยกเลิก
      </button>
      {open && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !loading && setOpen(false)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-dialog-title">
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              style={{ float: "right", width: 34, minHeight: 34 }}
              onClick={() => setOpen(false)}
              aria-label="ปิด"
              disabled={loading}
            >
              <X size={15} />
            </button>
            <div className="dialog-icon">
              <AlertTriangle size={21} />
            </div>
            <h3 id="cancel-dialog-title">ยืนยันขอยกเลิกการจอง?</h3>
            <p>
              การจอง {code} · {roomName} จะถูกยกเลิกทันที หากชำระเงินแล้ว ระบบจะบันทึกสถานะคืนเงินให้ทีมงานดำเนินการ
            </p>
            <div className="field" style={{ marginTop: 16 }}>
              <label htmlFor="cancel-reason">เหตุผลการยกเลิก (ไม่บังคับ)</label>
              <textarea
                className="textarea"
                id="cancel-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="เช่น แผนการเดินทางเปลี่ยน..."
                maxLength={300}
                style={{ minHeight: 80 }}
              />
            </div>
            <div className="dialog-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)} disabled={loading}>
                เก็บไว้ก่อน
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={submit} disabled={loading}>
                {loading ? <span className="spinner" /> : null}
                ยืนยันยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
