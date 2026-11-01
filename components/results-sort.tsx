"use client";

import { useRouter } from "next/navigation";

export function ResultsSort({ value, paramsString }: { value: string; paramsString: string }) {
  const router = useRouter();

  function change(next: string) {
    const params = new URLSearchParams(paramsString);
    params.set("sort", next);
    router.push(`/rooms?${params.toString()}`);
  }

  return (
    <select className="select sort-select" value={value} onChange={(event) => change(event.target.value)} aria-label="เรียงลำดับ">
      <option value="recommended">แนะนำสำหรับคุณ</option>
      <option value="price_asc">ราคา: ต่ำ – สูง</option>
      <option value="price_desc">ราคา: สูง – ต่ำ</option>
      <option value="size_desc">ขนาดห้องใหญ่สุด</option>
    </select>
  );
}
