import { apiSuccess, handleApiError, parseBody, requireApiUser } from "@/lib/api";
import { createBooking } from "@/lib/bookings";
import { bookingCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const input = await parseBody(request, bookingCreateSchema);
    const booking = createBooking(user, input);
    return apiSuccess(booking, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
