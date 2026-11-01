import { rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dbPath = join(process.cwd(), "data", "yohoo.db");
for (const suffix of ["", "-shm", "-wal"]) {
  try {
    rmSync(dbPath + suffix, { force: true });
  } catch {}
}
mkdirSync(join(process.cwd(), "data"), { recursive: true });
console.log("ลบฐานข้อมูลเดิมแล้ว — ระบบจะสร้างข้อมูลตัวอย่างใหม่เมื่อเริ่มแอป");
