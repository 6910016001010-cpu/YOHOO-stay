"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface PaymentActionsProps {
  paymentId: string;
  reference: string;
  kind: "APPROVE" | "REJECT" | "BOTH";
}

export function PaymentActions({ paymentId, reference, kind }: PaymentActionsProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState<"APPROVE" | "REJECT" | null>(null);

  async function submit(action: "APPROVE" | "REJECT") {
    setLoading(action);
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await response.json();
      if (!response.ok) {
        error(json.error ?? "ไม่สามารถตรวจสอบการชำระเงินได้");
        return;
      }
      success(action === "APPROVE" ? `อนุมัติการชำระเงิน ${reference} แล้ว` : `ปฏิเสธการชำระเงิน ${reference} แล้ว`);
      router.refresh();
    } catch {
      error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="table-actions">
      {kind !== "REJECT" && (
        <button type="button" className="btn btn-sm btn-lime" onClick={() => submit("APPROVE")} disabled={loading !== null}>
          {loading === "APPROVE" ? <span className="spinner" /> : <Check size={13} />}
          อนุมัติ
        </button>
      )}
      {kind !== "APPROVE" && (
        <button type="button" className="btn btn-sm btn-danger-soft" onClick={() => submit("REJECT")} disabled={loading !== null}>
          {loading === "REJECT" ? <span className="spinner" /> : <X size={13} />}
          ปฏิเสธ
        </button>
      )}
    </div>
  );
}
