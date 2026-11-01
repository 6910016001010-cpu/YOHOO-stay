import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getAmenities, getRoomById, getRoomTypes, getRoomsForAdmin } from "@/lib/rooms";
import { RoomForm } from "@/components/admin/room-form";
import { RoomActions } from "@/components/admin/room-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = getRoomById(id);
  return { title: room ? `แก้ไข ${room.name}` : "ไม่พบห้องพัก" };
}

export default async function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = getRoomById(id);
  if (!room) notFound();

  const types = getRoomTypes();
  const amenities = getAmenities();
  const bookingCount = getRoomsForAdmin().find((item) => item.id === room.id)?.bookingCount ?? 0;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <div className="breadcrumbs">
            <Link href="/admin/rooms">จัดการห้องพัก</Link>
            <span>/</span>
            <span>{room.code}</span>
          </div>
          <span className="eyebrow">Edit room</span>
          <h1>แก้ไข {room.name}</h1>
          <p>
            รหัสห้อง {room.code} · {room.type_name}
          </p>
        </div>
        <div className="admin-head-actions">
          <Link href={`/rooms/${room.slug}`} className="btn btn-outline btn-sm" target="_blank">
            <ExternalLink size={13} /> ดูหน้าห้องพัก
          </Link>
          <RoomActions
            roomId={room.id}
            code={room.code}
            name={room.name}
            status={room.status}
            bookingCount={bookingCount}
            redirectOnDelete
          />
          <Link href="/admin/rooms" className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} /> กลับ
          </Link>
        </div>
      </div>

      <RoomForm
        mode="edit"
        roomId={room.id}
        types={types}
        amenities={amenities}
        initialValues={{
          code: room.code,
          name: room.name,
          typeId: room.type_id,
          description: room.description,
          pricePerNight: String(room.price_per_night),
          capacity: String(room.capacity),
          sizeSqm: String(room.size_sqm),
          bedType: room.bed_type,
          floor: room.floor,
          status: room.status,
          featured: room.featured === 1,
          amenities: room.amenities.map((amenity) => amenity.id),
          images: room.images.map((image) => image.url),
        }}
      />
    </div>
  );
}
