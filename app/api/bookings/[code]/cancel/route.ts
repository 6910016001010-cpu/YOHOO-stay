import { apiSuccess, handleApiError, parseBody, requireApiUser } from "@/lib/api";
import { cancelBooking } from "@/lib/bookings";
import { cancelBookingSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireApiUser();
    const { code } = await params;
    const input = await parseBody(request, cancelBookingSchema);
    const booking = cancelBooking(code, user.id, input.reason ?? "");
    return apiSuccess(booking);
  } catch (error) {
    return handleApiError(error);
  }
}
