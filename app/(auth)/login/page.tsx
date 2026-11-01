import { Star } from "lucide-react";
import { Logo } from "@/components/logo";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="auth-page">
      <section className="auth-visual">
        <Logo />
        <div className="auth-quote">
          <span className="eyebrow on-dark">Your next escape</span>
          <h1 style={{ marginTop: 14 }}>
            ทุกวันหยุด
            <br />
            เริ่มต้นได้ที่นี่
          </h1>
          <p>
            เข้าสู่ระบบเพื่อจองห้องพัก ตรวจสอบสถานะ และกลับมาดูทุกความทรงจำในการเข้าพักของคุณกับ YOHOO
          </p>
          <div className="auth-quote-rating">
            <strong>4.9</strong>
            <span>
              <Star size={11} fill="#d9f26f" color="#d9f26f" style={{ marginRight: 4 }} />
              <Star size={11} fill="#d9f26f" color="#d9f26f" style={{ marginRight: 4 }} />
              <Star size={11} fill="#d9f26f" color="#d9f26f" style={{ marginRight: 4 }} />
              <Star size={11} fill="#d9f26f" color="#d9f26f" style={{ marginRight: 4 }} />
              <Star size={11} fill="#d9f26f" color="#d9f26f" />
              <br />
              คะแนนจากผู้เข้าพักกว่า 320 ท่าน
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
          <AuthForm mode="login" nextPath={sp.next} />
        </div>
      </section>
    </div>
  );
}
