import Link from "next/link";
import { Banknote, CreditCard, ExternalLink, ReceiptText, ShieldCheck } from "lucide-react";
import { getAdminPayments } from "@/lib/bookings";
import { formatThaiDateTime } from "@/lib/date";
import { formatTHB } from "@/lib/money";
import { PAYMENT_METHOD_LABELS } from "@/lib/status";
import type { PaymentWithBooking } from "@/lib/types";
import { PaymentActions } from "@/components/admin/payment-actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "การชำระเงิน" };

const TABS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "PENDING", label: "รอตรวจสอบ" },
  { value: "PAID", label: "ชำระแล้ว" },
  { value: "FAILED", label: "ไม่สำเร็จ" },
  { value: "REFUNDED", label: "คืนเงินแล้ว" },
];

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "รอตรวจสอบ",
  PAID: "ชำระแล้ว",
  FAILED: "ไม่สำเร็จ",
  REFUNDED: "คืนเงินแล้ว",
};

const PAYMENT_CLASS: Record<string, string> = {
  PENDING: "badge-pending_review",
  PAID: "badge-paid",
  FAILED: "badge-failed",
  REFUNDED: "badge-refunded",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" && params.status ? params.status : "ALL";

  const allPayments = getAdminPayments("ALL");
  const payments = status === "ALL" ? allPayments : getAdminPayments(status);

  const counts: Record<string, number> = { ALL: allPayments.length };
  let paidTotal = 0;
  let pendingTotal = 0;
  let refundedTotal = 0;
  for (const payment of allPayments) {
    counts[payment.status] = (counts[payment.status] ?? 0) + 1;
    if (payment.status === "PAID") paidTotal += payment.amount;
    if (payment.status === "PENDING") pendingTotal += payment.amount;
    if (payment.status === "REFUNDED") refundedTotal += payment.amount;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <span className="eyebrow">Payments</span>
          <h1>การชำระเงิน</h1>
          <p>ตรวจสอบหลักฐานการโอนเงิน อนุมัติหรือปฏิเสธรายการชำระ และติดตามยอดเงินคงเหลือ</p>
        </div>
        <div className="admin-head-actions">
          <Link href="/admin/bookings?payment=PENDING_REVIEW" className="btn btn-outline btn-sm">
            <ReceiptText size={14} /> ดูการจองที่รอตรวจเงิน
          </Link>
        </div>
      </div>

      <div className="stat-grid stat-grid-3">
        <article className="stat-card tone-lime">
          <div className="stat-top">
            <span className="stat-icon">
              <CreditCard size={18} />
            </span>
          </div>
          <p className="stat-label">ยอดรับชำระแล้ว</p>
          <p className="stat-value">{formatTHB(paidTotal)}</p>
          <p className="stat-note">{counts.PAID ?? 0} รายการที่ตรวจสอบแล้ว</p>
        </article>
        <article className="stat-card tone-amber">
          <div className="stat-top">
            <span className="stat-icon">
              <Banknote size={18} />
            </span>
          </div>
          <p className="stat-label">รอตรวจสอบ</p>
          <p className="stat-value">{formatTHB(pendingTotal)}</p>
          <p className="stat-note">{counts.PENDING ?? 0} รายการรออนุมัติ</p>
        </article>
        <article className="stat-card tone-forest">
          <div className="stat-top">
            <span className="stat-icon">
              <ShieldCheck size={18} />
            </span>
          </div>
          <p className="stat-label">ยอดคืนเงิน</p>
          <p className="stat-value">{formatTHB(refundedTotal)}</p>
          <p className="stat-note">{counts.REFUNDED ?? 0} รายการที่คืนเงินแล้ว</p>
        </article>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="กรองตามสถานะการชำระเงิน">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "ALL" ? "/admin/payments" : `/admin/payments?status=${tab.value}`}
            className={`admin-tab ${status === tab.value ? "active" : ""}`}
          >
            {tab.label}
            <span className="tab-count">{counts[tab.value] ?? 0}</span>
          </Link>
        ))}
      </div>

      <section className="panel">
        <div className="admin-table-head">
          <div>
            <h2>รายการชำระเงิน</h2>
            <p>{status === "ALL" ? "ทุกสถานะ" : PAYMENT_LABELS[status] ?? status} · เรียงรายการที่รอตรวจสอบขึ้นก่อน</p>
          </div>
          <span className="text-tiny muted">ทั้งหมด {payments.length} รายการ</span>
        </div>

        {payments.length === 0 ? (
          <div className="admin-empty">
            <CreditCard size={24} />
            <h3>ไม่พบรายการชำระเงิน</h3>
            <p>ยังไม่มีรายการในสถานะนี้ หรือผู้เข้าพักยังไม่ได้ชำระเงิน</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>วันที่ / เวลา</th>
                  <th>การจอง</th>
                  <th>วิธีชำระ</th>
                  <th className="text-right">จำนวนเงิน</th>
                  <th>หลักฐาน</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment: PaymentWithBooking) => (
                  <tr key={payment.id}>
                    <td>
                      <span className="table-strong">{formatThaiDateTime(payment.created_at)}</span>
                      <span className="table-sub">{payment.reference}</span>
                    </td>
                    <td>
                      <span className="table-code">{payment.booking_code}</span>
                      <span className="table-sub">{payment.guest_name}</span>
                    </td>
                    <td>
                      <span className="table-strong">{PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}</span>
                      <span className="table-sub">{payment.method === "CARD" ? "จำลองการชำระ" : "แนบสลิปโอนเงิน"}</span>
                    </td>
                    <td className="text-right">
                      <span className="table-strong">{formatTHB(payment.amount)}</span>
                      {payment.amount !== payment.booking_total && (
                        <span className="table-sub">ยอดจอง {formatTHB(payment.booking_total)}</span>
                      )}
                    </td>
                    <td>
                      {payment.slip_url ? (
                        <a href={payment.slip_url} target="_blank" rel="noreferrer" className="slip-link">
                          <img src={payment.slip_url} alt={`หลักฐานการโอน ${payment.reference}`} />
                          <span>
                            ดูสลิป <ExternalLink size={11} />
                          </span>
                        </a>
                      ) : (
                        <span className="text-tiny muted">ไม่มีสลิป</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${PAYMENT_CLASS[payment.status] ?? "badge-pending"}`}>
                        {PAYMENT_LABELS[payment.status] ?? payment.status}
                      </span>
                      {payment.paid_at && <span className="table-sub">{formatThaiDateTime(payment.paid_at)}</span>}
                    </td>
                    <td>
                      {payment.status === "PENDING" ? (
                        <PaymentActions paymentId={payment.id} reference={payment.reference} kind="BOTH" />
                      ) : (
                        <span className="text-tiny muted">ตรวจสอบแล้ว</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
