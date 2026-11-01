"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ImagePlus, Save, UploadCloud, X } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import type { Amenity, RoomStatus, RoomType } from "@/lib/types";

export interface RoomFormValues {
  code: string;
  name: string;
  typeId: string;
  description: string;
  pricePerNight: string;
  capacity: string;
  sizeSqm: string;
  bedType: string;
  floor: string;
  status: RoomStatus;
  featured: boolean;
  amenities: string[];
  images: string[];
}

interface RoomFormProps {
  mode: "create" | "edit";
  roomId?: string;
  types: RoomType[];
  amenities: Amenity[];
  initialValues: RoomFormValues;
}

const EMPTY_IMAGE = "";

export function RoomForm({ mode, roomId, types, amenities, initialValues }: RoomFormProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<RoomFormValues>(initialValues);
  const [imageDraft, setImageDraft] = useState(EMPTY_IMAGE);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  function set<K extends keyof RoomFormValues>(key: K, value: RoomFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleAmenity(id: string) {
    setValues((current) => ({
      ...current,
      amenities: current.amenities.includes(id)
        ? current.amenities.filter((item) => item !== id)
        : [...current.amenities, id],
    }));
  }

  function addImage() {
    const url = imageDraft.trim();
    if (!url) return;
    if (!url.startsWith("/") && !url.startsWith("http")) {
      error("URL รูปต้องเริ่มต้นด้วย / หรือ http");
      return;
    }
    if (values.images.includes(url)) {
      error("มีรูปนี้อยู่ในรายการแล้ว");
      return;
    }
    if (values.images.length >= 8) {
      error("เพิ่มรูปได้สูงสุด 8 รูป");
      return;
    }
    set("images", [...values.images, url]);
    setImageDraft("");
  }

  function removeImage(url: string) {
    set("images", values.images.filter((item) => item !== url));
  }

  function moveImage(url: string) {
    set("images", [url, ...values.images.filter((item) => item !== url)]);
  }

  async function upload(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      error("รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      error("ไฟล์ต้องมีขนาดไม่เกิน 5 MB");
      return;
    }
    if (values.images.length >= 8) {
      error("เพิ่มรูปได้สูงสุด 8 รูป");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "อัปโหลดไม่สำเร็จ");
      set("images", [...values.images, json.data.url]);
      success("อัปโหลดรูปห้องพักแล้ว");
    } catch (uploadError) {
      error((uploadError as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});

    if (values.images.length === 0) {
      setFieldErrors({ images: ["กรุณาเพิ่มรูปอย่างน้อย 1 รูป"] });
      error("กรุณาเพิ่มรูปห้องพักอย่างน้อย 1 รูป");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code: values.code,
        name: values.name,
        typeId: values.typeId,
        description: values.description,
        pricePerNight: Number(values.pricePerNight),
        capacity: Number(values.capacity),
        sizeSqm: Number(values.sizeSqm),
        bedType: values.bedType,
        floor: values.floor,
        status: values.status,
        featured: values.featured,
        amenities: values.amenities,
        images: values.images,
      };
      const response = await fetch(mode === "create" ? "/api/admin/rooms" : `/api/admin/rooms/${roomId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        const message = json.error ?? "ไม่สามารถบันทึกข้อมูลห้องพักได้";
        setFormError(message);
        error(message);
        return;
      }
      success(mode === "create" ? `เพิ่มห้อง ${values.code} แล้ว` : `บันทึกการแก้ไขห้อง ${values.code} แล้ว`);
      router.push("/admin/rooms");
      router.refresh();
    } catch {
      setFormError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
      error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const errorFor = (key: string) => fieldErrors[key]?.[0];

  return (
    <form className="room-form" onSubmit={submit}>
      {formError && (
        <div className="form-alert" role="alert">
          <X size={15} />
          <span>{formError}</span>
        </div>
      )}

      <section className="panel panel-pad form-section">
        <div className="form-section-head">
          <div>
            <h2>ข้อมูลพื้นฐาน</h2>
            <p>รหัสและชื่อห้องจะแสดงให้ผู้เข้าพักเห็นในหน้าค้นหา</p>
          </div>
          <span className="badge badge-available">{mode === "create" ? "ห้องใหม่" : "แก้ไขห้องพัก"}</span>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="room-code">รหัสห้อง *</label>
            <input
              className="input"
              id="room-code"
              value={values.code}
              onChange={(event) => set("code", event.target.value.toUpperCase())}
              placeholder="เช่น DLX-103"
              maxLength={20}
              aria-invalid={Boolean(errorFor("code"))}
              required
            />
            {errorFor("code") ? <span className="field-error">{errorFor("code")}</span> : <span className="field-hint">ใช้ A-Z, 0-9 และ - เท่านั้น</span>}
          </div>

          <div className="field">
            <label htmlFor="room-name">ชื่อห้อง *</label>
            <input
              className="input"
              id="room-name"
              value={values.name}
              onChange={(event) => set("name", event.target.value)}
              placeholder="เช่น ดีลักซ์ สวนเขียว"
              maxLength={100}
              aria-invalid={Boolean(errorFor("name"))}
              required
            />
            {errorFor("name") && <span className="field-error">{errorFor("name")}</span>}
          </div>

          <div className="field">
            <label htmlFor="room-type">ประเภทห้อง *</label>
            <select
              className="select"
              id="room-type"
              value={values.typeId}
              onChange={(event) => set("typeId", event.target.value)}
              aria-invalid={Boolean(errorFor("typeId"))}
              required
            >
              <option value="">เลือกประเภทห้อง</option>
              {types.map((type) => (
                <option value={type.id} key={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errorFor("typeId") && <span className="field-error">{errorFor("typeId")}</span>}
          </div>

          <div className="field">
            <label htmlFor="room-floor">ชั้น / อาคาร *</label>
            <input
              className="input"
              id="room-floor"
              value={values.floor}
              onChange={(event) => set("floor", event.target.value)}
              placeholder="เช่น 2 หรือ อาคาร B"
              maxLength={20}
              aria-invalid={Boolean(errorFor("floor"))}
              required
            />
            {errorFor("floor") && <span className="field-error">{errorFor("floor")}</span>}
          </div>

          <div className="field field-full">
            <label htmlFor="room-description">คำอธิบายห้อง *</label>
            <textarea
              className="textarea"
              id="room-description"
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
              placeholder="อธิบายบรรยากาศ จุดเด่น และสิ่งอำนวยความสะดวกของห้อง..."
              maxLength={2000}
              aria-invalid={Boolean(errorFor("description"))}
              required
            />
            <div className="field-hint-row">
              {errorFor("description") ? <span className="field-error">{errorFor("description")}</span> : <span className="field-hint">อย่างน้อย 20 ตัวอักษร</span>}
              <span className="field-hint">{values.description.length}/2000</span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel panel-pad form-section">
        <div className="form-section-head">
          <div>
            <h2>ราคาและรายละเอียด</h2>
            <p>ราคาต่อคืนเป็นบาท ระบบจะคำนวณค่าบริการ 10% และ VAT 7% ให้อัตโนมัติ</p>
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="room-price">ราคาต่อคืน (บาท) *</label>
            <input
              className="input"
              id="room-price"
              type="number"
              min={100}
              max={1000000}
              step={100}
              value={values.pricePerNight}
              onChange={(event) => set("pricePerNight", event.target.value)}
              aria-invalid={Boolean(errorFor("pricePerNight"))}
              required
            />
            {errorFor("pricePerNight") && <span className="field-error">{errorFor("pricePerNight")}</span>}
          </div>

          <div className="field">
            <label htmlFor="room-capacity">รองรับผู้เข้าพัก (คน) *</label>
            <select
              className="select"
              id="room-capacity"
              value={values.capacity}
              onChange={(event) => set("capacity", event.target.value)}
              aria-invalid={Boolean(errorFor("capacity"))}
            >
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <option value={count} key={count}>
                  {count} คน
                </option>
              ))}
            </select>
            {errorFor("capacity") && <span className="field-error">{errorFor("capacity")}</span>}
          </div>

          <div className="field">
            <label htmlFor="room-size">ขนาดห้อง (ตร.ม.) *</label>
            <input
              className="input"
              id="room-size"
              type="number"
              min={1}
              max={1000}
              value={values.sizeSqm}
              onChange={(event) => set("sizeSqm", event.target.value)}
              aria-invalid={Boolean(errorFor("sizeSqm"))}
              required
            />
            {errorFor("sizeSqm") && <span className="field-error">{errorFor("sizeSqm")}</span>}
          </div>

          <div className="field">
            <label htmlFor="room-bed">ประเภทเตียง *</label>
            <input
              className="input"
              id="room-bed"
              value={values.bedType}
              onChange={(event) => set("bedType", event.target.value)}
              placeholder="เช่น King Size"
              maxLength={80}
              aria-invalid={Boolean(errorFor("bedType"))}
              required
            />
            {errorFor("bedType") && <span className="field-error">{errorFor("bedType")}</span>}
          </div>

          <div className="field">
            <label htmlFor="room-status">สถานะห้อง *</label>
            <select
              className="select"
              id="room-status"
              value={values.status}
              onChange={(event) => set("status", event.target.value as RoomStatus)}
            >
              <option value="AVAILABLE">เปิดให้จอง</option>
              <option value="MAINTENANCE">ปิดปรับปรุง</option>
              <option value="INACTIVE">ปิดใช้งาน</option>
            </select>
          </div>

          <div className="field" style={{ justifyContent: "flex-end" }}>
            <label className="featured-toggle" htmlFor="room-featured">
              <input
                id="room-featured"
                type="checkbox"
                checked={values.featured}
                onChange={(event) => set("featured", event.target.checked)}
              />
              <span>
                <strong>แสดงเป็นห้องแนะนำ</strong>
                <small>แสดงในส่วนห้องแนะนำบนหน้าแรก</small>
              </span>
            </label>
          </div>
        </div>
      </section>

      <section className="panel panel-pad form-section">
        <div className="form-section-head">
          <div>
            <h2>สิ่งอำนวยความสะดวก</h2>
            <p>เลือกสิ่งอำนวยความสะดวกที่มีในห้องนี้</p>
          </div>
          <span className="badge badge-confirmed">{values.amenities.length} รายการ</span>
        </div>

        <div className="amenity-picker">
          {amenities.map((amenity) => (
            <label className={`amenity-option ${values.amenities.includes(amenity.id) ? "checked" : ""}`} key={amenity.id}>
              <input
                type="checkbox"
                checked={values.amenities.includes(amenity.id)}
                onChange={() => toggleAmenity(amenity.id)}
              />
              <span>{amenity.name}</span>
              {values.amenities.includes(amenity.id) && <Check size={13} />}
            </label>
          ))}
        </div>
      </section>

      <section className="panel panel-pad form-section">
        <div className="form-section-head">
          <div>
            <h2>รูปภาพห้องพัก</h2>
            <p>รูปแรกจะถูกใช้เป็นภาพหน้าปก · รองรับสูงสุด 8 รูป</p>
          </div>
          <span className="badge badge-pending">{values.images.length}/8 รูป</span>
        </div>

        {errorFor("images") && <div className="field-error" style={{ marginBottom: 12 }}>{errorFor("images")}</div>}

        {values.images.length > 0 ? (
          <div className="image-manager">
            {values.images.map((url, index) => (
              <div className={`image-tile ${index === 0 ? "is-cover" : ""}`} key={url}>
                <img src={url} alt={`รูปห้องพัก ${index + 1}`} />
                {index === 0 && <span className="image-cover-label">ภาพหน้าปก</span>}
                <div className="image-tile-actions">
                  {index !== 0 && (
                    <button type="button" className="image-tile-btn" onClick={() => moveImage(url)} title="ตั้งเป็นภาพหน้าปก">
                      <ImagePlus size={13} />
                    </button>
                  )}
                  <button type="button" className="image-tile-btn danger" onClick={() => removeImage(url)} title="ลบรูป">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="image-empty">
            <ImagePlus size={24} />
            <strong>ยังไม่มีรูปภาพ</strong>
            <span>เพิ่ม URL รูป หรืออัปโหลดไฟล์จากเครื่องของคุณ</span>
          </div>
        )}

        <div className="image-add-row">
          <input
            className="input"
            value={imageDraft}
            onChange={(event) => setImageDraft(event.target.value)}
            placeholder="วาง URL รูป เช่น /images/room-deluxe.webp"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addImage();
              }
            }}
          />
          <button type="button" className="btn btn-outline btn-sm" onClick={addImage}>
            <ImagePlus size={14} /> เพิ่ม URL
          </button>
          <label className="btn btn-outline btn-sm upload-btn">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) upload(file);
              }}
            />
            {uploading ? <span className="spinner" /> : <UploadCloud size={14} />}
            {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}
          </label>
        </div>
        <p className="field-hint" style={{ marginTop: 8 }}>
          แนะนำขนาด 1600 × 1000 px ขึ้นไป · JPG, PNG, WEBP ไม่เกิน 5 MB
        </p>
      </section>

      <div className="form-actions">
        <Link href="/admin/rooms" className="btn btn-outline">
          <ArrowLeft size={15} /> ยกเลิก
        </Link>
        <button type="submit" className="btn btn-lg" disabled={loading || uploading}>
          {loading ? <span className="spinner" /> : <Save size={16} />}
          {mode === "create" ? "เพิ่มห้องพัก" : "บันทึกการแก้ไข"}
        </button>
      </div>
    </form>
  );
}
