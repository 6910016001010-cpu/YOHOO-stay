import { apiSuccess, handleApiError, parseBody, requireApiAdmin } from "@/lib/api";
import { createRoom } from "@/lib/room-admin";
import { roomSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireApiAdmin();
    const input = await parseBody(request, roomSchema);
    const room = createRoom(input);
    return apiSuccess(room, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
