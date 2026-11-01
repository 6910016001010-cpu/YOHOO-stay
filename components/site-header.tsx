"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, LogOut, Menu, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { Logo } from "./logo";
import type { User } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/rooms", label: "ห้องพัก" },
  { href: "/#experience", label: "ประสบการณ์" },
  { href: "/#contact", label: "ติดต่อเรา" },
];

export function SiteHeader({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.replace("/#", "/")));

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Logo />

        <nav className="main-nav" aria-label="เมนูหลัก">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={isActive(item.href) ? "active" : ""}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link href="/rooms" className="btn btn-outline btn-sm header-search-link">
            <Search size={14} />
            ค้นหาห้อง
          </Link>
          {user ? (
            <>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="btn btn-ghost btn-sm">
                  <ShieldCheck size={14} />
                  แอดมิน
                </Link>
              )}
              <Link href="/account/bookings" className="header-user" title="บัญชีของฉัน">
                <span className="avatar">{user.name.slice(0, 1)}</span>
                <span className="header-user-name">{user.name}</span>
                <UserRound size={14} />
              </Link>
              <button className="btn btn-ghost btn-icon" aria-label="ออกจากระบบ" onClick={logout} disabled={loggingOut} type="button">
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline btn-sm">
                เข้าสู่ระบบ
              </Link>
              <Link href="/register" className="btn btn-sm">
                สมัครสมาชิก
              </Link>
            </>
          )}
          <button
            className="menu-toggle"
            aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <nav className={`mobile-nav ${open ? "open" : ""}`} aria-label="เมนูมือถือ">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={isActive(item.href) ? "active" : ""} onClick={() => setOpen(false)}>
            {item.label}
          </Link>
        ))}
        <Link href="/rooms" onClick={() => setOpen(false)}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <CalendarDays size={15} /> ค้นหาห้องว่าง
          </span>
        </Link>
        {user ? (
          <>
            <Link href="/account/bookings" onClick={() => setOpen(false)}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <UserRound size={15} /> การจองของฉัน
              </span>
            </Link>
            {user.role === "ADMIN" && (
              <Link href="/admin" onClick={() => setOpen(false)}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={15} /> แดชบอร์ดแอดมิน
                </span>
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: 12,
                border: 0,
                background: "transparent",
                color: "var(--danger)",
                textAlign: "left",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <LogOut size={15} /> ออกจากระบบ
            </button>
          </>
        ) : (
          <>
            <Link href="/login" onClick={() => setOpen(false)}>
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" onClick={() => setOpen(false)}>
              สมัครสมาชิก
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
