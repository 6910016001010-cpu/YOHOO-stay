import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Clock3,
  CreditCard,
  DoorOpen,
  LogIn,
  Percent,
  Plus,
  ReceiptText,
  UsersRound,
  Wallet,
} from "lucide-react";
import { getDashboardStats } from "@/lib/analytics";
import { getNextSevenDaysSummary, getRecentBookings } from "@/lib/bookings";
import { dateDay, formatThaiDate, formatWeekdayShort, todayISO } from "@/lib/date";
import { formatNumber, formatTHB } from "@/lib/money";
import {
  BOOKING_STATUS_CLASS,
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_CLASS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/status";
import { StatCard } from "@/components/admin/stat-card";

export const dynamic = "force-dynamic";

export const metadata = { title: "ภาพรวม" };

function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

export default function AdminDashboardPage() {
  const stats = getDashboardStats();
  const recent = getRecentBookings(6);
  const week = getNextSevenDaysSummary();
  const maxRevenue = Math.max(...stats.monthly.map((month) => month.revenue), 1);
  const maxType = Math.max(...stats.typeBreakdown.map((type) => type.count), 1);
  const totalTypeBookings = stats.typeBreakdown.reduce((total, type) => total + type.count, 0);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <span className="eyebrow">Overview</span>
          <h1>ภาพรวมธุรกิจ</h1>
          <p>ติดตามยอดจอง รายได้ และสถานะห้องพักแบบเรียลไทม์จากฐานข้อมูลของคุณ</p>
        </div>
        <div className="admin-head-actions">
          <Link href="/admin/rooms/new" className="btn btn-sm">
            <Plus size={14} /> เพิ่มห้องพัก
          </Link>
          <Link href="/admin/bookings" className="btn btn-outline btn-sm">
            ดูการจองทั้งหมด <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="รายได้เดือนนี้"
          value={formatTHB(stats.monthRevenue)}
          icon={Wallet}
          delta={stats.revenueGrowth}
          note={`เดือนก่อน ${formatTHB(stats.prevMonthRevenue)}`}
          tone="lime"
        />
        <StatCard
          label="การจองเดือนนี้"
          value={`${formatNumber(stats.monthBookings)} รายการ`}
          icon={CalendarCheck2}
          delta={stats.bookingGrowth}
          note={`เดือนก่อน ${formatNumber(stats.prevMonthBookings)} รายการ`}
        />
        <StatCard
          label="อัตราการเข้าพักเดือนนี้"
          value={`${stats.occupancy}%`}
          icon={Percent}
          note={`${stats.occupiedToday} / ${stats.totalRooms} ห้องมีแขกวันนี้`}
          tone="blue"
        />
        <StatCard
          label="รอดำเนินการ"
          value={`${stats.pendingBookings + stats.pendingPayments} รายการ`}
          icon={Clock3}
          note={`รออนุมัติ ${stats.pendingBookings} · รอตรวจเงิน ${stats.pendingPayments}`}
          tone="amber"
        />
      </div>

      <div className="dash-grid">
        <section className="panel panel-pad">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">รายได้ย้อนหลัง 6 เดือน</h2>
              <p className="panel-subtitle">จากรายการชำระเงินที่ตรวจสอบแล้ว</p>
            </div>
            <span className="badge badge-available">
              <ReceiptText size={11} /> {formatTHB(stats.monthly.reduce((total, month) => total + month.revenue, 0))}
            </span>
          </div>

          <div className="chart">
            {stats.monthly.map((month) => {
              const height = month.revenue === 0 ? 4 : Math.max(9, Math.round((month.revenue / maxRevenue) * 100));
              return (
                <div className="chart-col" key={month.month}>
                  <span className="chart-value">{month.revenue > 0 ? compact(month.revenue) : "—"}</span>
                  <div className="chart-track">
                    <div
                      className={`chart-bar ${month.month === stats.monthly[stats.monthly.length - 1].month ? "current" : ""}`}
                      style={{ height: `${height}%` }}
                      title={`${formatTHB(month.revenue)} · ${month.bookings} การจอง`}
                    >
                      <span className="chart-tooltip">
                        {formatTHB(month.revenue)}
                        <small>{month.bookings} การจอง · เข้าพัก {month.occupancy}%</small>
                      </span>
                    </div>
                  </div>
                  <span className="chart-label">{month.label}</span>
                  <span className="chart-sub">{month.bookings} จอง</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel panel-pad">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">ต้องดำเนินการวันนี้</h2>
              <p className="panel-subtitle">งานด่วนที่ควรตรวจสอบก่อน</p>
            </div>
          </div>

          <div className="ops-list">
            <Link href="/admin/bookings?status=PENDING" className="ops-item">
              <span className="ops-icon amber">
                <Clock3 size={16} />
              </span>
              <div>
                <strong>รออนุมัติการจอง</strong>
                <small>ตรวจสอบและยืนยันรายการใหม่</small>
              </div>
              <span className="ops-count">{stats.pendingBookings}</span>
            </Link>

            <Link href="/admin/payments?status=PENDING" className="ops-item">
              <span className="ops-icon blue">
                <CreditCard size={16} />
              </span>
              <div>
                <strong>รอตรวจสอบการชำระเงิน</strong>
                <small>หลักฐานโอนเงินจากผู้เข้าพัก</small>
              </div>
              <span className="ops-count">{stats.pendingPayments}</span>
            </Link>

            <Link href="/admin/bookings?status=CONFIRMED" className="ops-item">
              <span className="ops-icon green">
                <LogIn size={16} />
              </span>
              <div>
                <strong>แขกเข้าเช็คอินวันนี้</strong>
                <small>{formatThaiDate(todayISO(), "long")}</small>
              </div>
              <span className="ops-count">{stats.arrivalsToday}</span>
            </Link>

            <Link href="/admin/bookings?status=CHECKED_IN" className="ops-item">
              <span className="ops-icon coral">
                <DoorOpen size={16} />
              </span>
              <div>
                <strong>แขกเช็คเอาต์วันนี้</strong>
                <small>ตรวจสอบห้องก่อนคืนสถานะว่าง</small>
              </div>
              <span className="ops-count">{stats.departuresToday}</span>
            </Link>
          </div>

          <div className="next-days">
            <div className="next-days-head">
              <strong>7 วันข้างหน้า</strong>
              <span className="text-tiny muted">เข้า / ออก</span>
            </div>
            <div className="next-days-list">
              {week.map((day) => (
                <div className="next-day" key={day.date} title={`${formatThaiDate(day.date, "long")} · เข้า ${day.arrivals} · ออก ${day.departures}`}>
                  <span>{formatWeekdayShort(day.date)}</span>
                  <strong>{dateDay(day.date)}</strong>
                  <small>
                    <b className="arrive">{day.arrivals}</b> / <b className="depart">{day.departures}</b>
                  </small>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="dash-grid dash-grid-bottom">
        <section className="panel panel-pad">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">การจองล่าสุด</h2>
              <p className="panel-subtitle">6 รายการที่สร้างล่าสุดในระบบ</p>
            </div>
            <Link href="/admin/bookings" className="section-link">
              ทั้งหมด <ArrowRight size={12} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="admin-empty">
              <CalendarDays size={22} />
              <p>ยังไม่มีการจองในระบบ</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="admin-table compact">
                <thead>
                  <tr>
                    <th>การจอง</th>
                    <th>ผู้เข้าพัก</th>
                    <th>ห้องพัก</th>
                    <th>เข้าพัก</th>
                    <th className="text-right">ยอดรวม</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <Link href={`/admin/bookings?search=${booking.code}`} className="table-code">
                          {booking.code}
                        </Link>
                        <span className="table-sub">{formatThaiDate(booking.created_at.slice(0, 10), "short")}</span>
                      </td>
                      <td>
                        <span className="table-strong">{booking.guest_name}</span>
                        <span className="table-sub">{booking.guests} ท่าน</span>
                      </td>
                      <td>
                        <span className="table-strong">{booking.room_name}</span>
                        <span className="table-sub">{booking.room_code}</span>
                      </td>
                      <td>
                        <span className="table-strong">{formatThaiDate(booking.check_in, "short")}</span>
                        <span className="table-sub">{booking.nights} คืน</span>
                      </td>
                      <td className="text-right">
                        <span className="table-strong">{formatTHB(booking.total)}</span>
                        <span className="table-sub">
                          <span className={`badge ${PAYMENT_STATUS_CLASS[booking.payment_status]}`}>
                            {PAYMENT_STATUS_LABELS[booking.payment_status]}
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${BOOKING_STATUS_CLASS[booking.status]}`}>
                          {BOOKING_STATUS_LABELS[booking.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel panel-pad">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">สัดส่วนประเภทห้อง</h2>
              <p className="panel-subtitle">จากการจองที่ไม่ถูกยกเลิก</p>
            </div>
            <UsersRound size={18} className="muted" />
          </div>

          <div className="type-breakdown">
            {stats.typeBreakdown.map((type) => {
              const percent = totalTypeBookings > 0 ? Math.round((type.count / totalTypeBookings) * 100) : 0;
              return (
                <div className="type-row" key={type.name}>
                  <div className="type-row-head">
                    <strong>{type.name}</strong>
                    <span className="text-tiny muted">
                      {type.count} จอง · {percent}%
                    </span>
                  </div>
                  <div className="progress">
                    <span style={{ width: `${Math.max(3, Math.round((type.count / maxType) * 100))}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mini-summary">
            <div>
              <span>ระยะพักเฉลี่ย</span>
              <strong>{stats.averageStay} คืน</strong>
            </div>
            <div>
              <span>ห้องทั้งหมด</span>
              <strong>{stats.totalRooms} ห้อง</strong>
            </div>
            <div>
              <span>มีแขกวันนี้</span>
              <strong>{stats.occupiedToday} ห้อง</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
