import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAmenities, getRoomTypes } from "@/lib/rooms";
import { RoomForm } from "@/components/admin/room-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "เพิ่มห้องพักใหม่" };

export default function NewRoomPage() {
  const types = getRoomTypes();
  const amenities = getAmenities();

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <div className="breadcrumbs">
            <Link href="/admin/rooms">จัดการห้องพัก</Link>
            <span>/</span>
            <span>เพิ่มห้องพักใหม่</span>
          </div>
          <span className="eyebrow">New room</span>
          <h1>เพิ่มห้องพักใหม่</h1>
          <p>กรอกรายละเอียดห้องพัก รูปภาพ และสิ่งอำนวยความสะดวกเพื่อเปิดให้ผู้เข้าพักจอง</p>
        </div>
        <div className="admin-head-actions">
          <Link href="/admin/rooms" className="btn btn-outline btn-sm">
            <ArrowLeft size={14} /> กลับรายการห้องพัก
          </Link>
        </div>
      </div>

      <RoomForm
        mode="create"
        types={types}
        amenities={amenities}
        initialValues={{
          code: "",
          name: "",
          typeId: types[0]?.id ?? "",
          description: "",
          pricePerNight: "2500",
          capacity: "2",
          sizeSqm: "30",
          bedType: "King Size",
          floor: "1",
          status: "AVAILABLE",
          featured: false,
          amenities: [],
          images: [],
        }}
      />
    </div>
  );
}
