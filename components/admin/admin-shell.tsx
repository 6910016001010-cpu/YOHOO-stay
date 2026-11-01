"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import type { User } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard, exact: true },
  { href: "/admin/bookings", label: "การจอง", icon: CalendarDays },
  { href: "/admin/calendar", label: "ปฏิทินห้องพัก", icon: BedDouble },
  { href: "/admin/rooms", label: "จัดการห้องพัก", icon: ShieldCheck },
  { href: "/admin/payments", label: "การชำระเงิน", icon: CreditCard },
];

export function AdminShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  function isActive(item: (typeof NAV_ITEMS)[number]) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setOpen(false);
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <div className="admin-brand">
          <Logo href="/admin" subtitle="Admin console" />
          <button type="button" className="admin-sidebar-close" aria-label="ปิดเมนู" onClick={() => setOpen(false)}>
            <X size={17} />
          </button>
        </div>

        <div className="admin-nav-label">จัดการระบบ</div>
        <nav className="admin-nav" aria-label="เมนูผู้ดูแล">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item) ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-card">
          <span className="admin-sidebar-card-icon">
            <ShieldCheck size={17} />
          </span>
          <div>
            <strong>โหมดผู้ดูแลระบบ</strong>
            <p>จัดการการจอง ห้องพัก และการชำระเงินได้จากที่เดียว</p>
          </div>
        </div>

        <div className="admin-sidebar-foot">
          <Link href="/" className="admin-back-link" onClick={() => setOpen(false)}>
            <ArrowLeft size={15} /> กลับหน้าจองห้องพัก
          </Link>
          <button type="button" className="admin-logout" onClick={logout} disabled={loggingOut}>
            {loggingOut ? <span className="spinner" /> : <LogOut size={15} />}
            ออกจากระบบ
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="admin-menu-toggle" aria-label="เปิดเมนู" onClick={() => setOpen(true)}>
            <Menu size={19} />
          </button>

          <div className="admin-topbar-title">
            <span className="admin-topbar-eyebrow">YOHOO Admin</span>
            <strong>ระบบจัดการที่พัก</strong>
          </div>

          <div className="admin-topbar-right">
            <Link href="/rooms" className="btn btn-outline btn-sm admin-visit-site">
              ดูหน้าเว็บ
            </Link>
            <div className="admin-user">
              <span className="avatar">{user.name.slice(0, 1)}</span>
              <span className="admin-user-text">
                <strong>{user.name}</strong>
                <small>ผู้ดูแลระบบ</small>
              </span>
            </div>
            <button type="button" className="admin-icon-btn" aria-label="ออกจากระบบ" onClick={logout} disabled={loggingOut}>
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </div>

      {open && <button type="button" className="admin-sidebar-overlay" aria-label="ปิดเมนู" onClick={() => setOpen(false)} />}
    </div>
  );
}
