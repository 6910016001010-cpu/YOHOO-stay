import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Coffee,
  Compass,
  HeartHandshake,
  Leaf,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Waves,
} from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { RoomCard } from "@/components/room-card";
import { getFeaturedRooms, getRoomTypes } from "@/lib/rooms";
import { addDays, todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const checkIn = todayISO();
  const checkOut = addDays(checkIn, 1);
  const rooms = getFeaturedRooms(4);
  const types = getRoomTypes();

  return (
    <>
      <section className="home-hero">
        <div className="container hero-inner">
          <div className="hero-content">
            <span className="hero-badge">
              <span className="pulse-dot" />
              หัวหิน · ไทยแลนด์ · เปิดรับการจองแล้ววันนี้
            </span>
            <h1 className="hero-title">
              วันหยุดที่ดี
              <br />
              เริ่มจาก<span className="accent">ห้องที่ใช่</span>
            </h1>
            <p className="hero-copy">
              ที่พักบูทีคใจกลางธรรมชาติ ออกแบบเพื่อให้ทุกการพักผ่อนมีความหมาย
              ค้นหาห้องว่างแบบเรียลไทม์ เลือกวันที่ต้องการ แล้วปล่อยให้เราดูแลที่เหลือ
            </p>
            <div className="hero-meta">
              <span>
                <Star size={13} fill="currentColor" color="#d9f26f" /> 4.9 จากผู้เข้าพัก 320+ รีวิว
              </span>
              <span>
                <ShieldCheck size={13} /> ยกเลิกฟรีล่วงหน้า
              </span>
              <span>
                <MapPin size={13} /> ใกล้ชายหาด 180 เมตร
              </span>
            </div>
          </div>

          <div className="hero-rating">
            <div className="hero-rating-score">
              4.9 <span>★★★★★</span>
            </div>
            <p>“บรรยากาศเงียบสงบ ห้องสวยกว่าที่คิด อาหารเช้าดีมาก”</p>
            <div className="hero-rating-avatars" aria-hidden="true">
              <span>พ</span>
              <span>ณ</span>
              <span>ม</span>
              <span style={{ display: "grid", background: "var(--lime)", color: "var(--forest)" }}>+</span>
            </div>
            <p>คะแนนเฉลี่ยจากผู้เข้าพักจริงในปีนี้</p>
          </div>
        </div>
      </section>

      <div className="container search-dock">
        <SearchBar types={types} initialCheckIn={checkIn} initialCheckOut={checkOut} initialGuests={2} />
      </div>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">Stay collection</span>
              <h2 className="section-title">ห้องพักที่ออกแบบมาเพื่อช่วงเวลาของคุณ</h2>
              <p className="section-copy">
                แต่ละห้องมีเอกลักษณ์และมุมมองที่แตกต่าง แต่ทุกห้องมาพร้อมความสบายในแบบ YOHOO
              </p>
            </div>
            <Link href="/rooms" className="section-link">
              ดูห้องทั้งหมด <ArrowRight size={14} />
            </Link>
          </div>

          <div className="room-grid">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} checkIn={checkIn} checkOut={checkOut} guests={2} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-sm" id="experience">
        <div className="container">
          <div className="experience">
            <div className="experience-image">
              <img src="/images/lobby.webp" alt="พื้นที่ต้อนรับของ YOHOO" />
              <div className="experience-floating">
                <strong>180 m</strong>
                <p>เดินเพียง 2 นาทีถึงชายหาดหัวหินส่วนตัวที่เงียบสงบ</p>
              </div>
            </div>
            <div className="experience-content">
              <span className="eyebrow on-dark">The YOHOO feeling</span>
              <h2>ไม่ใช่แค่ที่พัก<br />แต่คือความรู้สึกที่อยากกลับมา</h2>
              <p>
                เราเชื่อว่าการพักผ่อนที่ดีเริ่มจากรายละเอียดเล็ก ๆ ที่ถูกใส่ใจ
                ตั้งแต่กลิ่นของผ้าเช็ดตัว ไปจนถึงกาแฟแก้วแรกในตอนเช้า
                เราออกแบบทุกช่วงเวลาให้คุณได้ผ่อนคลายอย่างแท้จริง
              </p>
              <ul className="experience-list">
                <li>
                  <span className="exp-icon">
                    <Coffee size={16} />
                  </span>
                  <div>
                    <strong>อาหารเช้าเชฟท้องถิ่น</strong>
                    <span>วัตถุดิบสดจากชุมชน เปลี่ยนเมนูตามฤดูกาล</span>
                  </div>
                </li>
                <li>
                  <span className="exp-icon">
                    <Waves size={16} />
                  </span>
                  <div>
                    <strong>สระว่ายน้ำและสวนส่วนตัว</strong>
                    <span>พื้นที่พักผ่อนกลางแจ้งที่เปิดให้เฉพาะผู้เข้าพัก</span>
                  </div>
                </li>
                <li>
                  <span className="exp-icon">
                    <HeartHandshake size={16} />
                  </span>
                  <div>
                    <strong>ดูแลแบบส่วนตัว</strong>
                    <span>ทีมงานพร้อมช่วยวางแผนวันหยุดให้เหมาะกับคุณ</span>
                  </div>
                </li>
              </ul>
              <Link href="/rooms" className="btn btn-lime">
                ค้นหาห้องว่าง <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="amenity-band">
        <div className="container amenity-band-inner">
          <h3 className="amenity-band-title">
            ทุกสิ่งสำคัญ <span>รวมอยู่ในทุกการเข้าพัก</span>
          </h3>
          <div className="amenity-strip">
            <span className="amenity-strip-item">
              <Coffee size={19} /> อาหารเช้า
            </span>
            <span className="amenity-strip-item">
              <Waves size={19} /> สระว่ายน้ำ
            </span>
            <span className="amenity-strip-item">
              <ShieldCheck size={19} /> Wi-Fi ฟรี
            </span>
            <span className="amenity-strip-item">
              <Leaf size={19} /> พื้นที่สีเขียว
            </span>
            <span className="amenity-strip-item">
              <Compass size={19} /> แนะนำสถานที่
            </span>
            <span className="amenity-strip-item">
              <BadgeCheck size={19} /> ยกเลิกฟรี
            </span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-content">
              <span className="eyebrow on-dark">Your escape awaits</span>
              <h2>ว่างไหม?<br />ถ้าว่าง เรามีห้องรอคุณอยู่</h2>
              <p>
                เลือกวันเข้าพักที่ใช่ แล้วให้ YOHOO เป็นส่วนหนึ่งของวันหยุดในความทรงจำ
                จองออนไลน์ได้ตลอด 24 ชั่วโมง
              </p>
              <div className="cta-actions">
                <Link href="/rooms" className="btn btn-lime btn-lg">
                  ดูห้องว่าง <Sparkles size={16} />
                </Link>
                <a href="#contact" className="btn btn-outline-light btn-lg">
                  ติดต่อเรา
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
