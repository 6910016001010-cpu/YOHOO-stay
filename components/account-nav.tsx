"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, Search, UserRound } from "lucide-react";
import type { User } from "@/lib/types";

export function AccountNav({ user }: { user: User }) {
  const pathname = usePathname();
  return (
    <aside className="account-sidebar">
      <div className="account-user">
        <span className="avatar lg">{user.name.slice(0, 1)}</span>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
      <nav className="account-nav">
        <Link href="/account/bookings" className={pathname.startsWith("/account/bookings") ? "active" : ""}>
          <CalendarDays size={15} /> การจองของฉัน
        </Link>
        <Link href="/rooms">
          <Search size={15} /> ค้นหาห้องพัก
        </Link>
        {user.role === "ADMIN" && (
          <Link href="/admin">
            <LayoutDashboard size={15} /> แดชบอร์ดแอดมิน
          </Link>
        )}
        <span style={{ padding: "10px 12px", color: "var(--muted-light)", fontSize: 10, display: "flex", gap: 8 }}>
          <UserRound size={14} /> สมาชิก YOHOO
        </span>
      </nav>
    </aside>
  );
}
