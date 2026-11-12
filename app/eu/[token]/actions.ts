"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { guestByToken, nextFridays, parseJpeg } from "@/lib/guest";
import { deleteObject, photoKey, putObject } from "@/lib/r2";

const PHOTO_CONSENT_VERSION = "2026-11-foto-v1";

export async function toggleDay(token: string, day: string, on: boolean) {
  const g = await guestByToken(token);
  if (!g || !nextFridays(12).includes(day)) return { ok: false };
  if (on) await db()`insert into availability (guest_id, day) values (${g.id}, ${day}) on conflict do nothing`;
  else await db()`delete from availability where guest_id = ${g.id} and day = ${day}`;
  return { ok: true };
}

export async function savePhoto(token: string, dataUrl: string, consent: boolean) {
  const g = await guestByToken(token);
  if (!g) return { ok: false, error: "Link inválido." };
  if (!consent) return { ok: false, error: "Precisamos do seu ok para guardar a foto." };
  const buf = parseJpeg(dataUrl);
  if (!buf) return { ok: false, error: "Não conseguimos ler essa imagem. Tenta outra?" };
  try {
    await putObject(photoKey(g.id), buf, "image/jpeg");
  } catch (e) {
    console.error("photo upload failed", e);
    return { ok: false, error: "Não conseguimos guardar a foto agora. Tenta de novo em instantes?" };
  }
  await db()`
    insert into guest_photos (guest_id, consent_at) values (${g.id}, now())
    on conflict (guest_id) do update set consent_at = excluded.consent_at, updated_at = now()`;
  await db()`insert into event_log (kind, guest_id, changes) values ('photo.set', ${g.id}, ${db().json({ consent_version: PHOTO_CONSENT_VERSION })})`;
  revalidatePath(`/eu/${token}`);
  return { ok: true };
}

export async function deletePhoto(token: string) {
  const g = await guestByToken(token);
  if (!g) return { ok: false };
  await deleteObject(photoKey(g.id));
  await db()`delete from guest_photos where guest_id = ${g.id}`;
  await db()`insert into event_log (kind, guest_id) values ('photo.delete', ${g.id})`;
  revalidatePath(`/eu/${token}`);
  return { ok: true };
}
