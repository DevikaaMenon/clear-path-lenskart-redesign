import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { apiError, ok, readJson, zodError } from "@/lib/server/api";
import { prisma } from "@/lib/server/db";
import { getOwner } from "@/lib/server/session";
import { rateLimit, clientIp } from "@/lib/server/rate-limit";
import { FIELD_LABELS, UPLOAD_LIMIT_BYTES, prescriptionRequestSchema, sniffFileType, validatePrescription } from "@/lib/prescription";

// Prescriptions are sensitive. Values are never logged; uploads are stored outside /public
// under UPLOAD_DIR with random names and are never served back by URL.
const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./storage/uploads");
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

async function itemFor(ownerKey: string, cartItemId: string) {
  return prisma.cartItem.findFirst({ where: { id: cartItemId, cart: { ownerKey } }, include: { lensOption: true } });
}

export async function POST(req: Request) {
  const limit = rateLimit(`rx:${clientIp(req)}`, 30, 60_000);
  if (!limit.ok) return apiError(429, "rate_limited", `Too many attempts. Try again in ${limit.retryAfter} seconds.`);
  const { ownerKey } = await getOwner();
  const type = req.headers.get("content-type") ?? "";

  // Upload mode (multipart)
  if (type.startsWith("multipart/form-data")) {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return apiError(400, "bad_upload", "The upload couldn't be read. Please try again.");
    }
    const file = form.get("file");
    const cartItemId = String(form.get("cartItemId") ?? "");
    if (!(file instanceof File)) return apiError(422, "validation_failed", "Choose a photo or PDF of your prescription.", { file: "Choose a photo or PDF of your prescription." });
    if (file.size === 0) return apiError(422, "validation_failed", "That file is empty.", { file: "That file is empty. Choose another." });
    if (file.size > UPLOAD_LIMIT_BYTES) return apiError(413, "too_large", "That file is larger than 5 MB.", { file: "That file is larger than 5 MB. Try a smaller photo or a screenshot." });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniffFileType(bytes);
    if (!kind) return apiError(415, "bad_type", "Only JPG, PNG, WebP or PDF files can be uploaded.", { file: "Only JPG, PNG, WebP or PDF files can be uploaded." });
    const item = await itemFor(ownerKey, cartItemId);
    if (!item) return apiError(404, "not_found", "That item is no longer in your bag.");

    await mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${randomBytes(16).toString("hex")}.${EXT[kind]}`;
    await writeFile(path.join(UPLOAD_DIR, name), bytes);
    const rx = await prisma.prescription.create({ data: { ownerKey, mode: "upload", fileRef: name, validated: false } });
    await prisma.cartItem.update({ where: { id: item.id }, data: { prescriptionId: rx.id } });
    return ok({ prescription: { id: rx.id, mode: rx.mode, validated: false } }, { status: 201 });
  }

  // Manual entry or "send later"
  const parsed = prescriptionRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { mode, cartItemId, values } = parsed.data;
  const item = await itemFor(ownerKey, cartItemId);
  if (!item) return apiError(404, "not_found", "That item is no longer in your bag.");

  if (mode === "later") {
    const rx = await prisma.prescription.create({ data: { ownerKey, mode: "later", validated: false } });
    await prisma.cartItem.update({ where: { id: item.id }, data: { prescriptionId: rx.id } });
    return ok({ prescription: { id: rx.id, mode: rx.mode, validated: false } }, { status: 201 });
  }

  const result = validatePrescription(values ?? {}, { purpose: item.purpose, needsAdd: item.lensOptionId === "rx-progressive" });
  if (!result.ok) {
    const fields: Record<string, string> = {};
    for (const i of result.issues) fields[i.field] = i.message;
    return apiError(422, "validation_failed", `Please check ${result.issues.length === 1 ? FIELD_LABELS[result.issues[0].field] : `${result.issues.length} values`}.`, fields);
  }
  const rx = await prisma.prescription.create({
    data: { ownerKey, mode: "manual", values: JSON.stringify(result.values), validated: true },
  });
  await prisma.cartItem.update({ where: { id: item.id }, data: { prescriptionId: rx.id } });
  return ok({ prescription: { id: rx.id, mode: rx.mode, validated: true }, warnings: result.warnings }, { status: 201 });
}
