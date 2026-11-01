import { AppError, apiSuccess, handleApiError, parseBody } from "@/lib/api";
import { createUser, establishSession, findUserByEmail } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = await parseBody(request, registerSchema);
    if (findUserByEmail(input.email)) {
      throw new AppError("อีเมลนี้ถูกใช้งานแล้ว", 409, "EMAIL_EXISTS", { email: ["อีเมลนี้ถูกใช้งานแล้ว"] });
    }
    const user = createUser({
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      passwordHash: hashPassword(input.password),
    });
    await establishSession(user.id);
    return apiSuccess({ user, redirectTo: "/rooms" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
