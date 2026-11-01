import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "./auth";
import type { User } from "./types";

export class AppError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string[]>;

  constructor(message: string, status = 400, code = "BAD_REQUEST", fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function apiError(message: string, status = 400, code = "BAD_REQUEST", fieldErrors?: Record<string, string[]>) {
  return NextResponse.json({ ok: false, error: message, code, fieldErrors }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return apiError(error.message, error.status, error.code, error.fieldErrors);
  }
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_form";
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return apiError("ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง", 422, "VALIDATION_ERROR", fieldErrors);
  }
  console.error("[API_ERROR]", error);
  return apiError("เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", 500, "INTERNAL_ERROR");
}

export async function requireApiUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AppError("กรุณาเข้าสู่ระบบก่อนดำเนินการ", 401, "UNAUTHORIZED");
  return user;
}

export async function requireApiAdmin(): Promise<User> {
  const user = await requireApiUser();
  if (user.role !== "ADMIN") throw new AppError("คุณไม่มีสิทธิ์เข้าถึงส่วนนี้", 403, "FORBIDDEN");
  return user;
}

export async function parseBody<T>(request: Request, parser: { parse: (data: unknown) => T }): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("รูปแบบข้อมูลไม่ถูกต้อง", 400, "INVALID_JSON");
  }
  return parser.parse(body);
}
