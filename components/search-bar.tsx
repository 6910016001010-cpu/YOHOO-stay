"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BedDouble, CalendarDays, Search, UsersRound } from "lucide-react";
import type { RoomType } from "@/lib/types";
import { addDays, todayISO } from "@/lib/date";

interface SearchBarProps {
  types: RoomType[];
  initialCheckIn: string;
  initialCheckOut: string;
  initialGuests?: number;
  initialType?: string;
}

export function SearchBar({ types, initialCheckIn, initialCheckOut, initialGuests = 2, initialType = "" }: SearchBarProps) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [type, setType] = useState(initialType);
  const [loading, setLoading] = useState(false);
  const today = todayISO();

  function handleCheckIn(value: string) {
    setCheckIn(value);
    if (value >= checkOut) {
      setCheckOut(addDays(value, 1));
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
    });
    if (type) params.set("type", type);
    router.push(`/rooms?${params.toString()}`);
  }

  return (
    <form className="search-panel" onSubmit={submit}>
      <div className="search-grid">
        <div className="search-cell">
          <label htmlFor="home-checkin">
            <CalendarDays size={11} style={{ display: "inline", verticalAlign: "-1px", marginRight: 5 }} />
            เช็คอิน
          </label>
          <input
            id="home-checkin"
            type="date"
            value={checkIn}
            min={today}
            onChange={(event) => handleCheckIn(event.target.value)}
            required
          />
        </div>
        <div className="search-cell">
          <label htmlFor="home-checkout">
            <CalendarDays size={11} style={{ display: "inline", verticalAlign: "-1px", marginRight: 5 }} />
            เช็คเอาต์
          </label>
          <input
            id="home-checkout"
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={(event) => setCheckOut(event.target.value)}
            required
          />
        </div>
        <div className="search-cell">
          <label htmlFor="home-guests">
            <UsersRound size={11} style={{ display: "inline", verticalAlign: "-1px", marginRight: 5 }} />
            ผู้เข้าพัก
          </label>
          <select id="home-guests" value={guests} onChange={(event) => setGuests(Number(event.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((count) => (
              <option key={count} value={count}>
                {count} ท่าน
              </option>
            ))}
          </select>
        </div>
        <div className="search-cell">
          <label htmlFor="home-type">
            <BedDouble size={11} style={{ display: "inline", verticalAlign: "-1px", marginRight: 5 }} />
            ประเภทห้อง
          </label>
          <select id="home-type" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">ทุกประเภท</option>
            {types.map((roomType) => (
              <option key={roomType.id} value={roomType.slug}>
                {roomType.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-lime search-submit" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : <Search size={17} />}
          ค้นหาห้องว่าง
        </button>
      </div>
      <div className="search-note">
        <span>
          <strong>ราคาเริ่มต้น ฿1,800</strong> ต่อคืน · รวมอาหารเช้าและ Wi-Fi
        </span>
        <span>ยกเลิกฟรีล่วงหน้า 48 ชั่วโมง</span>
      </div>
    </form>
  );
}
