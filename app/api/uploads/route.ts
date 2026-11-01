import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AppError, apiSuccess, handleApiError, requireApiUser } from "@/lib/api";

export const runtime = "nodejs";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  try {
    await requireApiUser();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new AppError("กรุณาเลือกไฟล์รูปภาพ", 400, "NO_FILE");
    if (file.size > 5 * 1024 * 1024) throw new AppError("ไฟล์ต้องมีขนาดไม่เกิน 5 MB", 413, "FILE_TOO_LARGE");
    const extension = ALLOWED.get(file.type);
    if (!extension) throw new AppError("รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP", 415, "INVALID_FILE_TYPE");

    const bytes = Buffer.from(await file.arrayBuffer());
    const filename = `slip-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), bytes);

    return apiSuccess({ url: `/uploads/${filename}`, filename, size: file.size }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
