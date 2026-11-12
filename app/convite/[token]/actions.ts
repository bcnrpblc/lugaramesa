"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function setRsvp(token: string, rsvp: "sim" | "nao") {
  if (!/^[a-z0-9]{8,40}$/.test(token) || !["sim", "nao"].includes(rsvp)) return { ok: false };
  try {
    const r = await db()`update invitations set rsvp = ${rsvp}, rsvp_at = now() where token = ${token} and removed_at is null returning 1`;
    revalidatePath(`/convite/${token}`);
    return { ok: r.length > 0 };
  } catch (e) {
    // DB guard: the seat was given to someone else after a "não".
    if (e instanceof Error && e.message.includes("MESA_CHEIA")) return { ok: false, full: true };
    throw e;
  }
}
