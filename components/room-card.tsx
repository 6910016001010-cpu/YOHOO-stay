import Link from "next/link";
import { ArrowUpRight, BedDouble, Maximize2, UsersRound } from "lucide-react";
import { AmenityIcon } from "./amenity-icon";
import { formatTHB } from "@/lib/money";
import type { RoomType, RoomWithDetails } from "@/lib/types";

interface RoomCardProps {
  room: RoomWithDetails;
  typeName?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

export function RoomCard({ room, typeName, checkIn, checkOut, guests }: RoomCardProps) {
  const params = new URLSearchParams();
  if (checkIn) params.set("checkIn", checkIn);
  if (checkOut) params.set("checkOut", checkOut);
  if (guests) params.set("guests", String(guests));
  const href = `/rooms/${room.slug}${params.toString() ? `?${params.toString()}` : ""}`;

  return (
    <Link className="room-card" href={href}>
      <div className="room-card-image">
        <img src={room.images[0]?.url ?? "/images/room-standard.webp"} alt={room.images[0]?.alt || room.name} loading="lazy" />
        <span className="room-card-tag">{typeName ?? room.type_name}</span>
        <span className="room-card-fav" aria-hidden="true">
          <ArrowUpRight size={15} />
        </span>
      </div>
      <div className="room-card-body">
        <span className="room-card-type">YOHOO collection · {room.code}</span>
        <h3 className="room-card-name">{room.name}</h3>
        <div className="room-card-facts">
          <span>
            <UsersRound size={12} /> {room.capacity} ท่าน
          </span>
          <span>
            <Maximize2 size={12} /> {room.size_sqm} ตร.ม.
          </span>
          <span>
            <BedDouble size={12} /> {room.bed_type}
          </span>
        </div>
        <div className="room-amenity-preview">
          {room.amenities.slice(0, 3).map((amenity) => (
            <span className="chip" key={amenity.id}>
              <AmenityIcon icon={amenity.icon} size={11} />
              {amenity.name}
            </span>
          ))}
        </div>
        <div className="room-card-foot">
          <div>
            <p className="price">
              {formatTHB(room.price_per_night)} <small>/ คืน</small>
            </p>
          </div>
          <span className="room-card-arrow">
            <ArrowUpRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function typeNameFor(typeId: string, types: RoomType[]): string | undefined {
  return types.find((type) => type.id === typeId)?.name;
}
