import Link from "next/link";
import { ArrowRight, BedDouble, CalendarDays, Eye, Maximize2, Sparkles, UsersRound } from "lucide-react";
import { RoomFilters } from "@/components/room-filters";
import { ResultsSort } from "@/components/results-sort";
import { AmenityIcon } from "@/components/amenity-icon";
import { getAmenities, getRoomTypes, searchRooms } from "@/lib/rooms";
import { addDays, formatDateRange, isValidISODate, todayISO } from "@/lib/date";
import { formatTHB } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ค้นหาห้องว่าง",
  description: "ค้นหาห้องพักว่างตามวันที่ ผู้เข้าพัก ประเภทห้อง ราคา และสิ่งอำนวยความสะดวก",
};

interface SearchParams {
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  amenities?: string;
  sort?: string;
}

export default async function RoomsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const today = todayISO();
  let checkIn = sp.checkIn && isValidISODate(sp.checkIn) ? sp.checkIn : today;
  let checkOut = sp.checkOut && isValidISODate(sp.checkOut) ? sp.checkOut : addDays(checkIn, 1);
  if (checkIn < today) checkIn = today;
  if (checkOut <= checkIn) checkOut = addDays(checkIn, 1);
  const guests = Math.min(6, Math.max(1, Number(sp.guests) || 1));
  const selectedAmenities = (sp.amenities ?? "").split(",").filter(Boolean);
  const minPrice = sp.minPrice && Number(sp.minPrice) > 0 ? Number(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice && Number(sp.maxPrice) > 0 ? Number(sp.maxPrice) : undefined;
  const sort = (["recommended", "price_asc", "price_desc", "size_desc"] as const).includes(sp.sort as never)
    ? (sp.sort as "recommended" | "price_asc" | "price_desc" | "size_desc")
    : "recommended";

  const types = getRoomTypes();
  const amenities = getAmenities();
  const rooms = searchRooms({
    checkIn,
    checkOut,
    guests,
    type: sp.type,
    minPrice,
    maxPrice,
    amenities: selectedAmenities,
    sort,
  });

  const currentParams = new URLSearchParams({
    checkIn,
    checkOut,
    guests: String(guests),
    ...(sp.type ? { type: sp.type } : {}),
    ...(sp.minPrice ? { minPrice: sp.minPrice } : {}),
    ...(sp.maxPrice ? { maxPrice: sp.maxPrice } : {}),
    ...(selectedAmenities.length ? { amenities: selectedAmenities.join(",") } : {}),
    ...(sp.sort ? { sort: sp.sort } : {}),
  });

  return (
    <div className="page-shell">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">หน้าแรก</Link>
          <span>/</span>
          <span>ค้นหาห้องพัก</span>
        </nav>

        <div className="page-head">
          <div>
            <span className="eyebrow">Find your room</span>
            <h1 className="page-title">ห้องว่างสำหรับวันหยุดของคุณ</h1>
            <p className="page-subtitle">
              {formatDateRange(checkIn, checkOut)} · {guests} ท่าน · {rooms.length} ห้องที่พร้อมให้คุณเข้าพัก
            </p>
          </div>
          <Link href="/#top" className="btn btn-outline" scroll={false}>
            <CalendarDays size={15} /> เปลี่ยนวันที่
          </Link>
        </div>

        <div className="results-layout">
          <RoomFilters
            types={types}
            amenities={amenities}
            initialType={sp.type ?? ""}
            initialAmenities={selectedAmenities}
            initialMinPrice={sp.minPrice ?? ""}
            initialMaxPrice={sp.maxPrice ?? ""}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
          />

          <div>
            <div className="results-toolbar">
              <p className="results-count">
                พบ <strong>{rooms.length}</strong> ห้องว่าง
                <span className="muted"> · {formatDateRange(checkIn, checkOut)}</span>
              </p>
              <ResultsSort value={sort} paramsString={currentParams.toString()} />
            </div>

            {rooms.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">
                  <SearchEmptyIcon />
                </span>
                <h3>ยังไม่พบห้องที่ตรงกับเงื่อนไข</h3>
                <p>ลองเปลี่ยนช่วงวันที่ ลดตัวกรองลง หรือเพิ่มช่วงราคา แล้วค้นหาอีกครั้ง</p>
                <Link href={`/rooms?checkIn=${checkIn}&checkOut=${addDays(checkIn, 2)}&guests=${guests}`} className="btn">
                  ลองช่วงวันที่อื่น <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div className="results-list">
                {rooms.map((room) => {
                  const detailParams = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });
                  return (
                    <article className="room-list-card" key={room.id}>
                      <Link className="room-list-image" href={`/rooms/${room.slug}?${detailParams.toString()}`}>
                        <img src={room.images[0]?.url ?? "/images/room-standard.webp"} alt={room.images[0]?.alt || room.name} />
                        <span className="room-card-tag">{room.type_name}</span>
                      </Link>
                      <div className="room-list-content">
                        <div className="room-list-top">
                          <div>
                            <span className="room-card-type">YOHOO collection · {room.code}</span>
                            <h2 className="room-list-name">{room.name}</h2>
                          </div>
                          <span className="badge badge-available">ว่าง</span>
                        </div>
                        <p className="room-list-desc">{room.description}</p>
                        <div className="chip-row" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 13 }}>
                          <span className="chip">
                            <UsersRound size={11} /> {room.capacity} ท่าน
                          </span>
                          <span className="chip">
                            <Maximize2 size={11} /> {room.size_sqm} ตร.ม.
                          </span>
                          <span className="chip">
                            <BedDouble size={11} /> {room.bed_type}
                          </span>
                          {room.amenities.slice(0, 2).map((amenity) => (
                            <span className="chip" key={amenity.id}>
                              <AmenityIcon icon={amenity.icon} size={11} /> {amenity.name}
                            </span>
                          ))}
                        </div>
                        <div className="room-list-foot">
                          <div>
                            <div className="price-block">
                              <span className="price">{formatTHB(room.price_per_night)}</span>
                              <small className="muted">/ คืน</small>
                            </div>
                            <p className="text-tiny muted" style={{ marginTop: 2 }}>
                              รวมอาหารเช้า · ยังไม่รวมภาษีและค่าบริการ
                            </p>
                          </div>
                          <div className="room-list-actions">
                            <Link href={`/rooms/${room.slug}?${detailParams.toString()}`} className="btn btn-ghost btn-sm">
                              <Eye size={14} /> ดูรายละเอียด
                            </Link>
                            <Link href={`/rooms/${room.slug}?${detailParams.toString()}`} className="btn btn-sm">
                              จองห้องนี้ <ArrowRight size={14} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="info-banner info" style={{ marginTop: 22 }}>
              <Sparkles size={15} />
              <span>
                ทุกห้องรวมอาหารเช้า Wi-Fi และพื้นที่ส่วนกลาง · ราคาที่แสดงเป็นราคาต่อคืน ยังไม่รวมค่าบริการ 10% และ VAT 7%
                ซึ่งจะแสดงอย่างชัดเจนในขั้นตอนจอง
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchEmptyIcon() {
  return <Eye size={24} />;
}
