"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, Sparkles, UserRound } from "lucide-react";
import { useToast } from "./toast-provider";

interface AuthFormProps {
  mode: "login" | "register";
  nextPath?: string;
}

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const { success, error } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function fillDemo(role: "guest" | "admin") {
    setEmail(role === "admin" ? "admin@yohoo.co" : "guest@yohoo.co");
    setPassword(role === "admin" ? "Admin123!" : "Guest123!");
    setFieldErrors({});
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email, password }
          : { name, email, phone, password, confirmPassword };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        setFormError(json.error ?? "ดำเนินการไม่สำเร็จ");
        error(json.error ?? "ดำเนินการไม่สำเร็จ");
        return;
      }
      success(mode === "login" ? `ยินดีต้อนรับกลับ ${json.data.user.name}` : "สมัครสมาชิกสำเร็จ");
      const requested = nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null;
      const destination = requested ?? json.data.redirectTo ?? "/rooms";
      // A full navigation is required: the auth layout redirects signed-in users,
      // so a client-side push to the protected page would race with that redirect.
      window.location.assign(destination);
    } catch {
      setFormError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่");
      error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const err = (key: string) => fieldErrors[key]?.[0];

  return (
    <div className="auth-card">
      <span className="eyebrow">{mode === "login" ? "Welcome back" : "Join the stay"}</span>
      <h1 className="auth-title">{mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชีใหม่"}</h1>
      <p className="auth-subtitle">
        {mode === "login"
          ? "เข้าสู่ระบบเพื่อจัดการการจอง ติดตามสถานะ และชำระเงินได้ในที่เดียว"
          : "สมัครสมาชิกฟรีเพื่อจองห้องพักและจัดการวันหยุดของคุณได้ง่ายขึ้น"}
      </p>

      {formError && (
        <div className="info-banner" style={{ marginTop: 18, marginBottom: 0, background: "var(--danger-soft)", borderColor: "#f0cbc4", color: "var(--danger)" }}>
          <AlertCircle size={15} />
          <span>{formError}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={submit} noValidate>
        {mode === "register" && (
          <div className="field">
            <label htmlFor="name">ชื่อ-นามสกุล</label>
            <div className="input-wrap">
              <UserRound size={15} />
              <input
                className="input"
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="เช่น ภูเขา ว่างดี"
                autoComplete="name"
                aria-invalid={Boolean(err("name"))}
                required
                minLength={2}
              />
            </div>
            {err("name") && <span className="field-error">{err("name")}</span>}
          </div>
        )}

        <div className="field">
          <label htmlFor="email">อีเมล</label>
          <div className="input-wrap">
            <Mail size={15} />
            <input
              className="input"
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(err("email"))}
              required
            />
          </div>
          {err("email") && <span className="field-error">{err("email")}</span>}
        </div>

        {mode === "register" && (
          <div className="field">
            <label htmlFor="phone">เบอร์โทรศัพท์ (ไม่บังคับ)</label>
            <div className="input-wrap">
              <Phone size={15} />
              <input
                className="input"
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="08X-XXX-XXXX"
                autoComplete="tel"
                aria-invalid={Boolean(err("phone"))}
              />
            </div>
            {err("phone") && <span className="field-error">{err("phone")}</span>}
          </div>
        )}

        <div className="field">
          <label htmlFor="password">รหัสผ่าน</label>
          <div className="input-wrap">
            <LockKeyhole size={15} />
            <input
              className="input"
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "register" ? "อย่างน้อย 8 ตัวอักษร" : "••••••••"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              aria-invalid={Boolean(err("password"))}
              required
              minLength={mode === "register" ? 8 : 1}
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                border: 0,
                background: "transparent",
                color: "var(--muted)",
              }}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {err("password") && <span className="field-error">{err("password")}</span>}
        </div>

        {mode === "register" && (
          <div className="field">
            <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</label>
            <div className="input-wrap">
              <LockKeyhole size={15} />
              <input
                className="input"
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                autoComplete="new-password"
                aria-invalid={Boolean(err("confirmPassword"))}
                required
              />
            </div>
            {err("confirmPassword") && <span className="field-error">{err("confirmPassword")}</span>}
          </div>
        )}

        <button className="btn btn-lg btn-block" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          {mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      {mode === "login" && (
        <>
          <div className="auth-divider">บัญชีตัวอย่างสำหรับทดลองระบบ</div>
          <div className="demo-accounts">
            <button type="button" className="demo-account" onClick={() => fillDemo("guest")}>
              <strong>👤 Guest</strong>
              <span>guest@yohoo.co · Guest123!</span>
            </button>
            <button type="button" className="demo-account" onClick={() => fillDemo("admin")}>
              <strong>🛡️ Admin</strong>
              <span>admin@yohoo.co · Admin123!</span>
            </button>
          </div>
          <p className="auth-footer">
            ยังไม่มีบัญชี? <Link href="/register">สมัครสมาชิกฟรี</Link>
          </p>
        </>
      )}

      {mode === "register" && (
        <p className="auth-footer">
          มีบัญชีอยู่แล้ว? <Link href="/login">เข้าสู่ระบบ</Link>
        </p>
      )}

      <p className="auth-footer" style={{ marginTop: 12 }}>
        <Sparkles size={10} style={{ display: "inline", verticalAlign: "-1px" }} /> ข้อมูลของคุณปลอดภัยและไม่ถูกส่งต่อ
      </p>
    </div>
  );
}
