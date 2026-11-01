import Link from "next/link";
import { BedDouble, CalendarCheck2, Pencil, Plus, Search, UsersRound, Wrench } from "lucide-react";
import { getRoomsForAdmin } from "@/lib/rooms";
import { formatTHB } from "@/lib/money";
import { ROOM_STATUS_CLASS, ROOM_STATUS_LABELS } from "@/lib/status";
import { RoomActions } from "@/components/admin/room-actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "จัดการห้องพัก" };

const TABS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "AVAILABLE", label: "เปิดให้จอง" },
  { value: "MAINTENANCE", label: "ปิดปรับปรุง" },
  { value: "INACTIVE", label: "ปิดใช้งาน" },
];

export default async function AdminRoomsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" && params.status ? params.status : "ALL";
  const search = typeof params.search === "string" ? params.search.toLowerCase() : "";

  const allRooms = getRoomsForAdmin();
  const counts: Record<string, number> = { ALL: allRooms.length };
  for (const room of allRooms) counts[room.status] = (counts[room.status] ?? 0) + 1;

  const rooms = allRooms.filter((room) => {
    const matchStatus = status === "ALL" || room.status === status;
    const matchSearch =
      !search ||
      room.name.toLowerCase().includes(search) ||
      room.code.toLowerCase().includes(search) ||
      (room.type_name ?? "").toLowerCase().includes(search);
    return matchStatus && matchSearch;
  });

  const maintenance = counts.MAINTENANCE ?? 0;
  const upcoming = allRooms.reduce((total, room) => total + room.upcomingCount, 0);

  function tabHref(value: string) {
    const query = new URLSearchParams();
    if (value !== "ALL") query.set("status", value);
    if (search) query.set("search", search);
    const qs = query.toString();
    return `/admin/rooms${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <span className="eyebrow">Inventory</span>
          <h1>จัดการห้องพัก</h1>
          <p>เพิ่ม แก้ไข เปลี่ยนสถานะ และจัดการรูปภาพ/สิ่งอำนวยความสะดวกของทุกห้อง</p>
        </div>
        <div className="admin-head-actions">
          <Link href="/admin/rooms/new" className="btn btn-sm">
            <Plus size={14} /> เพิ่มห้องพักใหม่
          </Link>
        </div>
      </div>

      <div className="admin-mini-stats">
        <div>
          <span>ห้องทั้งหมด</span>
          <strong>{allRooms.length} ห้อง</strong>
        </div>
        <div>
          <span>เปิดให้จอง</span>
          <strong>{counts.AVAILABLE ?? 0} ห้อง</strong>
        </div>
        <div>
          <span>ปิดปรับปรุง</span>
          <strong>{maintenance} ห้อง</strong>
        </div>
        <div>
          <span>การจองที่กำลังจะมาถึง</span>
          <strong>{upcoming} รายการ</strong>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist" aria-label="กรองตามสถานะห้องพัก">
          {TABS.map((tab) => (
            <Link key={tab.value} href={tabHref(tab.value)} className={`admin-tab ${status === tab.value ? "active" : ""}`}>
              {tab.label}
              <span className="tab-count">{counts[tab.value] ?? 0}</span>
            </Link>
          ))}
        </div>

        <form className="admin-search" method="get">
          {status !== "ALL" && <input type="hidden" name="status" value={status} />}
          <div className="input-wrap">
            <Search size={15} />
            <input className="input" name="search" defaultValue={search} placeholder="ค้นหารหัส ชื่อ หรือประเภทห้อง" />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">
            ค้นหา
          </button>
        </form>
      </div>

      {rooms.length === 0 ? (
        <div className="panel admin-empty">
          <BedDouble size={24} />
          <h3>ไม่พบห้องพัก</h3>
          <p>ลองเปลี่ยนตัวกรอง หรือเพิ่มห้องพักใหม่เข้าสู่ระบบ</p>
          <Link href="/admin/rooms/new" className="btn btn-sm">
            <Plus size={13} /> เพิ่มห้องพัก
          </Link>
        </div>
      ) : (
        <div className="admin-room-grid">
          {rooms.map((room) => (
            <article className="admin-room-card" key={room.id}>
              <div className="admin-room-cover">
                <img src={room.images[0]?.url ?? "/images/room-standard.webp"} alt={room.name} />
                <span className="admin-room-code">{room.code}</span>
                <span className={`badge ${ROOM_STATUS_CLASS[room.status]}`}>{ROOM_STATUS_LABELS[room.status]}</span>
              </div>

              <div className="admin-room-body">
                <span className="admin-room-type">{room.type_name}</span>
                <h3>{room.name}</h3>

                <div className="admin-room-facts">
                  <span>
                    <BedDouble size={12} /> {room.bed_type}
                  </span>
                  <span>
                    <UsersRound size={12} /> {room.capacity} ท่าน · {room.size_sqm} ตร.ม.
                  </span>
                  <span>
                    <CalendarCheck2 size={12} /> {room.bookingCount} การจอง · {room.upcomingCount} กำลังจะมาถึง
                  </span>
                </div>

                <div className="admin-room-price">
                  <strong>{formatTHB(room.price_per_night)}</strong>
                  <span>/ คืน</span>
                  {room.featured === 1 && <span className="badge badge-confirmed">แนะนำ</span>}
                </div>

                {room.amenities.length > 0 && (
                  <div className="admin-room-amenities">
                    {room.amenities.slice(0, 4).map((amenity) => (
                      <span key={amenity.id}>{amenity.name}</span>
                    ))}
                    {room.amenities.length > 4 && <span>+{room.amenities.length - 4}</span>}
                  </div>
                )}

                <div className="admin-room-actions-row">
                  <Link href={`/admin/rooms/${room.id}`} className="btn btn-sm btn-outline">
                    <Pencil size={13} /> แก้ไข
                  </Link>
                  <RoomActions
                    roomId={room.id}
                    code={room.code}
                    name={room.name}
                    status={room.status}
                    bookingCount={room.bookingCount}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="info-banner info" style={{ marginTop: 22 }}>
        <Wrench size={15} />
        <span>ห้องที่มีประวัติการจองแล้วจะไม่สามารถลบได้ แนะนำให้เปลี่ยนสถานะเป็น “ปิดใช้งาน” หรือ “ปิดปรับปรุง” แทน</span>
      </div>
    </div>
  );
}
