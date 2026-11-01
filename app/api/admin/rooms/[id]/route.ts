import { apiSuccess, handleApiError, parseBody, requireApiAdmin } from "@/lib/api";
import { deleteRoom, updateRoom } from "@/lib/room-admin";
import { roomSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const input = await parseBody(request, roomSchema);
    const room = updateRoom(id, input);
    return apiSuccess(room);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    deleteRoom(id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
