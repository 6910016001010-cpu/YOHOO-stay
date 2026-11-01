import { redirect } from "next/navigation";
import { getCurrentUser, homeForRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));
  return <>{children}</>;
}
