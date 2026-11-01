import { AppError, apiSuccess, handleApiError, parseBody, requireApiUser } from "@/lib/api";
import { createPayment } from "@/lib/bookings";
import { paymentSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const input = await parseBody(request, paymentSchema);
    if (input.method === "BANK_TRANSFER" && !input.slipUrl.startsWith("/uploads/")) {
      throw new AppError("หลักฐานการโอนเงินไม่ถูกต้อง", 422, "INVALID_SLIP");
    }
    const result = createPayment(user, input);
    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
