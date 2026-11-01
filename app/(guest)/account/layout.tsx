import { requireUser } from "@/lib/auth";
import { AccountNav } from "@/components/account-nav";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account/bookings");
  return (
    <div className="page-shell">
      <div className="container">
        <div className="account-layout">
          <AccountNav user={user} />
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
