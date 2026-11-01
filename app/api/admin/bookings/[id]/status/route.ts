import { apiSuccess, handleApiError, parseBody, requireApiAdmin } from "@/lib/api";
import { updateBookingStatus } from "@/lib/bookings";
import { adminBookingStatusSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiAdmin();
    const { id } = await params;
    const input = await parseBody(request, adminBookingStatusSchema);
    const booking = updateBookingStatus(id, input.status, admin.id, input.note ?? "");
    return apiSuccess(booking);
  } catch (error) {
    return handleApiError(error);
  }
}
