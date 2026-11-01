import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-main">
        <div className="footer-brand">
          <Logo subtitle="Boutique stay" />
          <p>
            พื้นที่พักผ่อนที่ออกแบบจากความเข้าใจในทุกรายละเอียด ใจกลางธรรมชาติ ใกล้ทะเล และห่างจากความวุ่นวายเพียงพอที่จะได้ยินเสียงตัวเอง
          </p>
          <div className="footer-newsletter">
            <input type="email" placeholder="อีเมลสำหรับข่าวสาร" aria-label="อีเมลสำหรับข่าวสาร" />
            <button type="button">สมัครรับข่าว</button>
          </div>
        </div>

        <div className="footer-column">
          <h4>สำรวจ</h4>
          <ul>
            <li>
              <Link href="/rooms">ห้องพักทั้งหมด</Link>
            </li>
            <li>
              <Link href="/#experience">ประสบการณ์</Link>
            </li>
            <li>
              <Link href="/#contact">ติดต่อเรา</Link>
            </li>
            <li>
              <Link href="/account/bookings">การจองของฉัน</Link>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>ความช่วยเหลือ</h4>
          <ul>
            <li>
              <Link href="/login">เข้าสู่ระบบ</Link>
            </li>
            <li>
              <Link href="/register">สมัครสมาชิก</Link>
            </li>
            <li>
              <a href="mailto:stay@yohoo.co">stay@yohoo.co</a>
            </li>
            <li>
              <a href="tel:+66812345678">081 234 5678</a>
            </li>
          </ul>
        </div>

        <div className="footer-column footer-newsletter-col">
          <h4>มาพบกัน</h4>
          <ul>
            <li>
              <p style={{ display: "flex", gap: 8 }}>
                <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                88/9 ถนนเลียบชายหาด ตำบลหัวหิน อำเภอหัวหิน ประจวบคีรีขันธ์ 77110
              </p>
            </li>
            <li>
              <p style={{ display: "flex", gap: 8 }}>
                <Phone size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                +66 81 234 5678
              </p>
            </li>
            <li>
              <p style={{ display: "flex", gap: 8 }}>
                <Mail size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                stay@yohoo.co
              </p>
            </li>
            <li>
              <p style={{ marginTop: 5 }}>เปิดให้บริการทุกวัน · 08:00 – 22:00</p>
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} YOHOO ว่างไหม. All rights reserved.</span>
        <div className="footer-bottom-links">
          <span>นโยบายความเป็นส่วนตัว</span>
          <span>เงื่อนไขการจอง</span>
          <span>Cookie Policy</span>
        </div>
      </div>
    </footer>
  );
}
