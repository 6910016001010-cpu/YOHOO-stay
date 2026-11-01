import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  BedDouble,
  CalendarClock,
  CigaretteOff,
  Clock3,
  MapPin,
  Maximize2,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";
import { AmenityIcon } from "@/components/amenity-icon";
import { BookingWidget } from "@/components/booking-widget";
import { getRoomBySlug } from "@/lib/rooms";
import { isRoomAvailable } from "@/lib/rooms";
import { addDays, formatDateRange, isValidISODate, todayISO } from "@/lib/date";
import { formatTHB } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const room = getRoomBySlug(slug);
  if (!room) return { title: "ไม่พบห้องพัก" };
  return {
    title: room.name,
    description: room.description.slice(0, 150),
  };
}

export default async function RoomDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const room = getRoomBySlug(slug);
  if (!room || room.status === "INACTIVE") notFound();

  const today = todayISO();
  let checkIn = sp.checkIn && isValidISODate(sp.checkIn) ? sp.checkIn : addDays(today, 1);
  let checkOut = sp.checkOut && isValidISODate(sp.checkOut) ? sp.checkOut : addDays(checkIn, 1);
  if (checkIn < today) checkIn = today;
  if (checkOut <= checkIn) checkOut = addDays(checkIn, 1);
  const guests = Math.min(room.capacity, Math.max(1, Number(sp.guests) || 2));
  const available = room.status === "AVAILABLE" && isRoomAvailable(room.id, checkIn, checkOut);

  return (
    <div className="page-shell">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">หน้าแรก</Link>
          <span>/</span>
          <Link href={`/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}>ห้องพัก</Link>
          <span>/</span>
          <span>{room.name}</span>
        </nav>

        <div className="detail-gallery">
          <div className="detail-gallery-main">
            <img src={room.images[0]?.url} alt={room.images[0]?.alt || room.name} />
            <span className="room-card-tag" style={{ top: 18, left: 18 }}>
              {room.type_name}
            </span>
          </div>
          <div className="detail-gallery-side">
            {room.images.slice(1, 3).map((image) => (
              <div key={image.id}>
                <img src={image.url} alt={image.alt} loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        <div className="detail-main">
          <div>
            <div className="detail-title-row">
              <div>
                <span className="eyebrow">Room {room.code}</span>
                <h1 className="detail-title">{room.name}</h1>
              </div>
              <div className="detail-rating">
                <Star size={14} fill="currentColor" /> 4.9
                <span className="muted text-tiny" style={{ fontWeight: 500 }}>
                  (48 รีวิว)
                </span>
              </div>
            </div>

            <div className="detail-facts">
              <span>
                <UsersRound size={14} /> รองรับ {room.capacity} ท่าน
              </span>
              <span>
                <Maximize2 size={14} /> {room.size_sqm} ตร.ม.
              </span>
              <span>
                <BedDouble size={14} /> {room.bed_type}
              </span>
              <span>
                <MapPin size={14} /> อาคารหลัก ชั้น {room.floor}
              </span>
            </div>

            <section className="detail-section">
              <h2>เกี่ยวกับห้องนี้</h2>
              <p className="detail-description">{room.description}</p>
            </section>

            <section className="detail-section">
              <h2>สิ่งอำนวยความสะดวก</h2>
              <div className="amenities-grid">
                {room.amenities.map((amenity) => (
                  <div className="amenity-item" key={amenity.id}>
                    <AmenityIcon icon={amenity.icon} size={17} />
                    {amenity.name}
                  </div>
                ))}
              </div>
            </section>

            <section className="detail-section">
              <h2>เงื่อนไขการเข้าพัก</h2>
              <div className="rules-grid">
                <div className="rule-item">
                  <Clock3 size={16} />
                  <div>
                    <strong>เช็คอิน / เช็คเอาต์</strong>
                    เช็คอิน 14:00 – 20:00 · เช็คเอาต์ก่อน 12:00
                  </div>
                </div>
                <div className="rule-item">
                  <ShieldCheck size={16} />
                  <div>
                    <strong>ยกเลิกฟรี</strong>
                    ยกเลิกได้ฟรีเมื่อแจ้งล่วงหน้าอย่างน้อย 48 ชั่วโมง
                  </div>
                </div>
                <div className="rule-item">
                  <CigaretteOff size={16} />
                  <div>
                    <strong>ห้ามสูบบุหรี่</strong>
                    ปลอดบุหรี่ทุกพื้นที่ภายในห้องและระเบียง
                  </div>
                </div>
                <div className="rule-item">
                  <PawPrint size={16} />
                  <div>
                    <strong>สัตว์เลี้ยง</strong>
                    ไม่อนุญาตให้นำสัตว์เลี้ยงเข้าพัก (ยกเว้นสุนัขนำทาง)
                  </div>
                </div>
                <div className="rule-item">
                  <UtensilsCrossed size={16} />
                  <div>
                    <strong>อาหารเช้า</strong>
                    เสิร์ฟทุกวัน 07:00 – 10:30 ณ ห้องอาหารหลัก
                  </div>
                </div>
                <div className="rule-item">
                  <CalendarClock size={16} />
                  <div>
                    <strong>เอกสารเข้าพัก</strong>
                    กรุณาแสดงบัตรประชาชนหรือพาสปอร์ตตอนเช็คอิน
                  </div>
                </div>
              </div>
            </section>

            <section className="detail-section">
              <div className="info-banner">
                <BadgeCheck size={16} />
                <span>
                  การจองของคุณจะได้รับการตรวจสอบจากทีมงานภายใน 2 ชั่วโมงในเวลาทำการ
                  และจะได้รับอีเมลยืนยันเมื่อการจองได้รับการอนุมัติ
                </span>
              </div>
              <div className="info-banner info" style={{ marginBottom: 0 }}>
                <Sparkles size={16} />
                <span>
                  ต้องการจัดเตรียมอะไรพิเศษสำหรับการเข้าพักครั้งนี้ แจ้งเราได้ในช่อง “คำขอพิเศษ” ตอนจอง
                </span>
              </div>
            </section>

            <Link href={`/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`} className="btn btn-ghost btn-sm">
              <ArrowLeft size={14} /> กลับไปดูห้องอื่น
            </Link>
          </div>

          <div>
            <BookingWidget
              roomId={room.id}
              roomSlug={room.slug}
              pricePerNight={room.price_per_night}
              capacity={room.capacity}
              initialCheckIn={checkIn}
              initialCheckOut={checkOut}
              initialGuests={guests}
              roomAvailable={available}
              roomStatus={room.status}
            />
            <div className="panel panel-pad" style={{ marginTop: 13, padding: 18 }}>
              <p className="text-xs" style={{ fontWeight: 700 }}>
                ช่วงวันที่คุณเลือก
              </p>
              <p className="text-small muted" style={{ marginTop: 4 }}>
                {formatDateRange(checkIn, checkOut)}
              </p>
              <hr className="divider" style={{ margin: "12px 0" }} />
              <p className="text-tiny muted" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>ราคาเริ่มต้น</span>
                <strong style={{ color: "var(--ink)" }}>{formatTHB(room.price_per_night)} / คืน</strong>
              </p>
              <p className="text-tiny muted" style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                <span>ค่าบริการ + ภาษี</span>
                <span>10% + 7%</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
