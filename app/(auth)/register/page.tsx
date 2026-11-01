import { Star } from "lucide-react";
import { Logo } from "@/components/logo";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "สมัครสมาชิก" };

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <section className="auth-visual">
        <Logo />
        <div className="auth-quote">
          <span className="eyebrow on-dark">Members only</span>
          <h1 style={{ marginTop: 14 }}>
            เริ่มต้น
            <br />
            ความทรงจำใหม่
          </h1>
          <p>
            สมัครสมาชิก YOHOO เพื่อจองห้องพักได้รวดเร็วขึ้น จัดการการจอง และรับข้อเสนอพิเศษสำหรับสมาชิก
          </p>
          <div className="auth-quote-rating">
            <strong>180 m</strong>
            <span>
              <Star size={11} fill="#d9f26f" color="#d9f26f" style={{ marginRight: 4 }} />
              ใช้เวลาเดินเพียง 2 นาทีก็ถึงชายหาด
              <br />
              ที่พักเงียบสงบ  surrounded by greenery
            </span>
          </div>
        </div>
        <p style={{ color: "rgba(255,255,255,.35)", fontSize: 9 }}>
          YOHOO Boutique Stay · Hua Hin, Thailand
        </p>
      </section>
      <section className="auth-panel">
        <div style={{ width: "min(100%, 420px)" }}>
          <div style={{ marginBottom: 28 }}>
            <Logo />
          </div>
          <AuthForm mode="register" />
        </div>
      </section>
    </div>
  );
}
