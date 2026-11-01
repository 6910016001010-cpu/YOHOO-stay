import Link from "next/link";

export function Logo({ href = "/", subtitle = "Boutique stay" }: { href?: string; subtitle?: string }) {
  return (
    <Link href={href} className="logo" aria-label="YOHOO ว่างไหม หน้าแรก">
      <span className="logo-mark" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M5 5.5 12 13l7-7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 12.5V20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="logo-type">
        <span className="logo-name">
          YOHOO<em>.stay</em>
        </span>
        <span className="logo-tag">{subtitle}</span>
      </span>
    </Link>
  );
}
