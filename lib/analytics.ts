import { getDb } from "./db";
import { addDays, diffDays, monthBounds, monthKey, shiftMonth, todayISO } from "./date";

export interface MonthlyPoint {
  month: string;
  label: string;
  revenue: number;
  bookings: number;
  occupancy: number;
}

export interface DashboardStats {
  monthRevenue: number;
  prevMonthRevenue: number;
  revenueGrowth: number;
  monthBookings: number;
  prevMonthBookings: number;
  bookingGrowth: number;
  occupancy: number;
  occupiedToday: number;
  totalRooms: number;
  pendingBookings: number;
  pendingPayments: number;
  arrivalsToday: number;
  departuresToday: number;
  averageStay: number;
  monthly: MonthlyPoint[];
  statusCounts: Record<string, number>;
  typeBreakdown: { name: string; count: number }[];
}

function sumBookingNightsForPeriod(start: string, end: string): number {
  const bookings = getDb()
    .prepare(
      `SELECT check_in, check_out FROM bookings
       WHERE status IN ('CONFIRMED','CHECKED_IN','CHECKED_OUT') AND check_in < ? AND check_out > ?`,
    )
    .all(end, start) as unknown as { check_in: string; check_out: string }[];
  return bookings.reduce((total, booking) => {
    const from = booking.check_in < start ? start : booking.check_in;
    const to = booking.check_out > end ? end : booking.check_out;
    return total + Math.max(0, diffDays(from, to));
  }, 0);
}

function getMonthlyPoint(month: string): MonthlyPoint {
  const db = getDb();
  const bounds = monthBounds(month);
  const rooms = Number((db.prepare("SELECT COUNT(*) AS n FROM rooms WHERE status != 'INACTIVE'").get() as { n: number }).n);
  const revenue = Number(
    (
      db
        .prepare(
          `SELECT COALESCE(SUM(p.amount), 0) AS total FROM payments p
           JOIN bookings b ON b.id = p.booking_id
           WHERE p.status = 'PAID' AND strftime('%Y-%m', p.paid_at, '+7 hours') = ? AND b.status != 'REJECTED'`,
        )
        .get(month) as { total: number }
    ).total,
  );
  const bookings = Number(
    (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM bookings WHERE strftime('%Y-%m', created_at, '+7 hours') = ? AND status NOT IN ('CANCELLED','REJECTED')`,
        )
        .get(month) as { n: number }
    ).n,
  );
  const occupiedNights = sumBookingNightsForPeriod(bounds.start, bounds.end);
  const occupancy = rooms > 0 ? Math.min(100, Math.round((occupiedNights / (rooms * bounds.daysInMonth)) * 100)) : 0;
  const [year, m] = month.split("-").map(Number);
  const label = new Intl.DateTimeFormat("th-TH", { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, m - 1, 1)),
  );
  return { month, label, revenue, bookings, occupancy };
}

export function getDashboardStats(): DashboardStats {
  const db = getDb();
  const currentMonth = monthKey();
  const previousMonth = shiftMonth(currentMonth, -1);
  const current = getMonthlyPoint(currentMonth);
  const previous = getMonthlyPoint(previousMonth);
  const today = todayISO();
  const bounds = monthBounds(currentMonth);

  const totalRooms = Number(
    (db.prepare("SELECT COUNT(*) AS n FROM rooms WHERE status != 'INACTIVE'").get() as { n: number }).n,
  );
  const occupiedToday = Number(
    (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM bookings
           WHERE status IN ('CONFIRMED','CHECKED_IN') AND check_in <= ? AND check_out > ?`,
        )
        .get(today, today) as { n: number }
    ).n,
  );
  const pendingBookings = Number(
    (db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE status = 'PENDING'").get() as { n: number }).n,
  );
  const pendingPayments = Number(
    (db.prepare("SELECT COUNT(*) AS n FROM payments WHERE status = 'PENDING'").get() as { n: number }).n,
  );
  const arrivalsToday = Number(
    (
      db
        .prepare("SELECT COUNT(*) AS n FROM bookings WHERE check_in = ? AND status IN ('CONFIRMED','PENDING')")
        .get(today) as { n: number }
    ).n,
  );
  const departuresToday = Number(
    (
      db
        .prepare("SELECT COUNT(*) AS n FROM bookings WHERE check_out = ? AND status = 'CHECKED_IN'")
        .get(today) as { n: number }
    ).n,
  );
  const avgRow = db
    .prepare(
      "SELECT COALESCE(AVG(nights), 0) AS avg FROM bookings WHERE status IN ('CONFIRMED','CHECKED_IN','CHECKED_OUT')",
    )
    .get() as { avg: number };

  const statusRows = db
    .prepare("SELECT status, COUNT(*) AS n FROM bookings GROUP BY status")
    .all() as unknown as { status: string; n: number }[];
  const statusCounts = Object.fromEntries(statusRows.map((row) => [row.status, Number(row.n)]));

  const typeRows = db
    .prepare(
      `SELECT rt.name, COUNT(b.id) AS n FROM room_types rt
       LEFT JOIN rooms r ON r.type_id = rt.id
       LEFT JOIN bookings b ON b.room_id = r.id AND b.status NOT IN ('CANCELLED','REJECTED')
       GROUP BY rt.id ORDER BY n DESC`,
    )
    .all() as unknown as { name: string; n: number }[];

  const monthly = Array.from({ length: 6 }, (_, index) => getMonthlyPoint(shiftMonth(currentMonth, index - 5)));
  const revenueGrowth = previous.revenue > 0 ? Math.round(((current.revenue - previous.revenue) / previous.revenue) * 100) : 100;
  const bookingGrowth = previous.bookings > 0 ? Math.round(((current.bookings - previous.bookings) / previous.bookings) * 100) : 100;

  return {
    monthRevenue: current.revenue,
    prevMonthRevenue: previous.revenue,
    revenueGrowth,
    monthBookings: current.bookings,
    prevMonthBookings: previous.bookings,
    bookingGrowth,
    occupancy: current.occupancy,
    occupiedToday,
    totalRooms,
    pendingBookings,
    pendingPayments,
    arrivalsToday,
    departuresToday,
    averageStay: Math.round(Number(avgRow.avg) * 10) / 10,
    monthly,
    statusCounts,
    typeBreakdown: typeRows.map((row) => ({ name: row.name, count: Number(row.n) })),
  };
}

export function getOccupancyForDate(date: string): { occupied: number; total: number; percent: number } {
  const db = getDb();
  const total = Number((db.prepare("SELECT COUNT(*) AS n FROM rooms WHERE status = 'AVAILABLE'").get() as { n: number }).n);
  const occupied = Number(
    (
      db
        .prepare(
          "SELECT COUNT(*) AS n FROM bookings WHERE status IN ('CONFIRMED','CHECKED_IN') AND check_in <= ? AND check_out > ?",
        )
        .get(date, date) as { n: number }
    ).n,
  );
  return { occupied, total, percent: total > 0 ? Math.round((occupied / total) * 100) : 0 };
}

export function getMonthOccupancy(month: string, roomCount: number): number {
  const bounds = monthBounds(month);
  if (roomCount === 0) return 0;
  return Math.min(100, Math.round((sumBookingNightsForPeriod(bounds.start, bounds.end) / (roomCount * bounds.daysInMonth)) * 100));
}

export function getRevenueDateRange() {
  return { today: todayISO(), tomorrow: addDays(todayISO(), 1) };
}
