import { z } from "zod";
import { apiSuccess, handleApiError, parseBody, requireApiAdmin } from "@/lib/api";
import { updateRoomStatus } from "@/lib/room-admin";

export const runtime = "nodejs";

const statusSchema = z.object({ status: z.enum(["AVAILABLE", "MAINTENANCE", "INACTIVE"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const input = await parseBody(request, statusSchema);
    updateRoomStatus(id, input.status);
    return apiSuccess({ id, status: input.status });
  } catch (error) {
    return handleApiError(error);
  }
}
