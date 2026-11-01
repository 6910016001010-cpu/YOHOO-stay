"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import type { RoomStatus } from "@/lib/types";

interface RoomActionsProps {
  roomId: string;
  code: string;
  name: string;
  status: RoomStatus;
  bookingCount?: number;
  redirectOnDelete?: boolean;
}

export function RoomActions({ roomId, code, name, status, bookingCount = 0, redirectOnDelete = false }: RoomActionsProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function changeStatus(nextStatus: RoomStatus) {
    setSavingStatus(true);
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await response.json();
      if (!response.ok) {
        error(json.error ?? "ไม่สามารถเปลี่ยนสถานะห้องพักได้");
        return;
      }
      success(`อัปเดตสถานะห้อง ${code} แล้ว`);
      router.refresh();
    } catch {
      error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setSavingStatus(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok) {
        error(json.error ?? "ไม่สามารถลบห้องพักได้");
        setDeleteOpen(false);
        return;
      }
      success(`ลบห้อง ${code} แล้ว`);
      setDeleteOpen(false);
      if (redirectOnDelete) {
        router.push("/admin/rooms");
        router.refresh();
      } else {
        router.refresh();
      }
    } catch {
      error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="room-actions">
      <label className="room-status-select">
        {savingStatus ? <span className="spinner" /> : null}
        <select
          className="select"
          value={status}
          onChange={(event) => changeStatus(event.target.value as RoomStatus)}
          disabled={savingStatus}
          aria-label={`สถานะห้อง ${code}`}
        >
          <option value="AVAILABLE">เปิดให้จอง</option>
          <option value="MAINTENANCE">ปิดปรับปรุง</option>
          <option value="INACTIVE">ปิดใช้งาน</option>
        </select>
      </label>

      <button
        type="button"
        className="btn btn-ghost btn-icon"
        style={{ width: 36, minHeight: 36, color: "var(--danger)" }}
        onClick={() => setDeleteOpen(true)}
        disabled={bookingCount > 0}
        title={bookingCount > 0 ? "ห้องนี้มีประวัติการจอง ไม่สามารถลบได้" : `ลบห้อง ${code}`}
        aria-label={`ลบห้อง ${code}`}
      >
        <Trash2 size={15} />
      </button>

      {deleteOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && !deleting && setDeleteOpen(false)}
        >
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="delete-room-title">
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              style={{ float: "right", width: 34, minHeight: 34 }}
              onClick={() => setDeleteOpen(false)}
              aria-label="ปิด"
              disabled={deleting}
            >
              <X size={15} />
            </button>
            <div className="dialog-icon">
              <AlertTriangle size={21} />
            </div>
            <h3 id="delete-room-title">ลบห้องพักนี้?</h3>
            <p>
              {code} · {name} จะถูกลบออกจากระบบอย่างถาวร การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="dialog-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                ยกเลิก
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={remove} disabled={deleting}>
                {deleting ? <span className="spinner" /> : <Trash2 size={13} />}
                ยืนยันลบห้อง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
