"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Filter, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import type { Amenity, RoomType } from "@/lib/types";

interface RoomFiltersProps {
  types: RoomType[];
  amenities: Amenity[];
  initialType: string;
  initialAmenities: string[];
  initialMinPrice: string;
  initialMaxPrice: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export function RoomFilters({
  types,
  amenities,
  initialType,
  initialAmenities,
  initialMinPrice,
  initialMaxPrice,
  checkIn,
  checkOut,
  guests,
}: RoomFiltersProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(initialType);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialAmenities);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);

  function toggleAmenity(slug: string) {
    setSelectedAmenities((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });
    if (type) params.set("type", type);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (selectedAmenities.length) params.set("amenities", selectedAmenities.join(","));
    router.push(`/rooms?${params.toString()}`);
    setOpen(false);
  }

  function clear() {
    const params = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });
    router.push(`/rooms?${params.toString()}`);
    setOpen(false);
  }

  return (
    <>
      <div className="filter-mobile-head">
        <button type="button" className="btn btn-outline btn-sm mobile-filter-toggle" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={14} /> : <SlidersHorizontal size={14} />}
          {open ? "ปิดตัวกรอง" : "ตัวกรองห้องพัก"}
        </button>
        <span className="text-xs muted">{amenities.length + types.length} ตัวเลือก</span>
      </div>

      <aside className={`filter-card ${open ? "mobile-open" : ""}`}>
        <form onSubmit={submit}>
          <div className="filter-head">
            <h2 className="filter-title">
              <Filter size={15} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
              กรองผลลัพธ์
            </h2>
            <button type="button" className="filter-clear" onClick={clear}>
              ล้างทั้งหมด
            </button>
          </div>

          <div className="filter-group">
            <p className="filter-label">ประเภทห้อง</p>
            <div className="filter-options">
              <label className="filter-check">
                <input type="radio" name="type" value="" checked={type === ""} onChange={() => setType("")} />
                ทุกประเภท
              </label>
              {types.map((roomType) => (
                <label className="filter-check" key={roomType.id}>
                  <input
                    type="radio"
                    name="type"
                    value={roomType.slug}
                    checked={type === roomType.slug}
                    onChange={() => setType(roomType.slug)}
                  />
                  {roomType.name}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <p className="filter-label">ช่วงราคาต่อคืน</p>
            <div className="filter-price">
              <input
                className="input"
                type="number"
                placeholder="ต่ำสุด"
                min={0}
                step={100}
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                aria-label="ราคาต่ำสุด"
              />
              <span className="muted text-xs">–</span>
              <input
                className="input"
                type="number"
                placeholder="สูงสุด"
                min={0}
                step={100}
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                aria-label="ราคาสูงสุด"
              />
            </div>
          </div>

          <div className="filter-group">
            <p className="filter-label">สิ่งอำนวยความสะดวก</p>
            <div className="filter-options">
              {amenities.map((amenity) => (
                <label className="filter-check" key={amenity.id}>
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity.slug)}
                    onChange={() => toggleAmenity(amenity.slug)}
                  />
                  {amenity.name}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-actions">
            <button type="submit" className="btn btn-sm btn-block">
              ใช้ตัวกรอง
            </button>
            <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={clear}>
              <RotateCcw size={13} /> รีเซ็ต
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
