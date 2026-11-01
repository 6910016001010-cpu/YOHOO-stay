import { getDb } from "@/lib/db";
import { AppError, apiSuccess, handleApiError, parseBody } from "@/lib/api";
import { createUser, establishSession, findUserByEmail } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = await parseBody(request, loginSchema);
    const user = findUserByEmail(input.email);
    if (!user || !verifyPassword(input.password, user.password_hash)) {
      throw new AppError("อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401, "INVALID_CREDENTIALS");
    }
    await establishSession(user.id);
    return apiSuccess({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      redirectTo: user.role === "ADMIN" ? "/admin" : "/rooms",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
