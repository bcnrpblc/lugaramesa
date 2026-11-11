import "server-only";
import { db } from "@/lib/db";

export type Invite = {
  token: string;
  rsvp: "pendente" | "sim" | "nao";
  guest_name: string;
  referral_code: string;
  title: string;
  meal_type: string;
  starts_at: Date;
  duration_min: number;
  address: string | null;
  address_notes: string | null;
  suggested_amount: string | null;
  pix_key: string | null;
  wine_note: string | null;
  public_id: string;
  wine_ok: boolean;
  confirmed: number;
  seats: number;
};

export async function getInvite(token: string): Promise<Invite | null> {
  if (!/^[a-z0-9]{8,40}$/.test(token)) return null;
  const r = await db()<Invite[]>`
    select i.token, i.rsvp, split_part(g.name, ' ', 1) as guest_name, g.referral_code,
           t.title, t.meal_type, t.starts_at, t.duration_min, t.address, t.address_notes,
           t.suggested_amount::text as suggested_amount, t.pix_key, t.wine_note, t.public_id, t.seats,
           coalesce((select bool_and(g2.wine = 'sim') from invitations i2 join guests g2 on g2.id = i2.guest_id
                     where i2.table_id = t.id and i2.rsvp <> 'nao'), false) as wine_ok,
           (select count(*)::int from invitations i3 where i3.table_id = t.id and i3.rsvp = 'sim') as confirmed
    from invitations i join guests g on g.id = i.guest_id join dinner_tables t on t.id = i.table_id
    where i.token = ${token}`;
  return r[0] || null;
}
