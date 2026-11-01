import { apiSuccess, handleApiError, parseBody, requireApiAdmin } from "@/lib/api";
import { verifyPayment } from "@/lib/bookings";
import { adminPaymentActionSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiAdmin();
    const { id } = await params;
    const input = await parseBody(request, adminPaymentActionSchema);
    const payment = verifyPayment(id, input.action, admin.id);
    return apiSuccess(payment);
  } catch (error) {
    return handleApiError(error);
  }
}
