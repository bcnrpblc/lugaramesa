import { input } from "./Shell";
import type { TableRow } from "@/lib/admin-data";

const TZ = "America/Sao_Paulo";
const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const hm = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);

function F({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`grid gap-1 text-sm font-semibold ${wide ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
}

/** Same fields for "nova mesa" and "editar mesa". */
export function TableFields({ t, defaultDate }: { t?: TableRow | null; defaultDate?: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <F label="Nome"><input name="title" className={input} defaultValue={t?.title ?? "Jantar de sexta"} maxLength={80} /></F>
      <F label="Refeição">
        <select name="meal_type" className={input} defaultValue={t?.meal_type ?? "jantar"}>
          <option value="jantar">Jantar</option><option value="almoco">Almoço</option><option value="cafe">Café da manhã</option>
        </select>
      </F>
      <F label="Data"><input name="date" type="date" required className={input} defaultValue={t ? ymd(t.starts_at) : defaultDate} /></F>
      <F label="Hora"><input name="time" type="time" required className={input} defaultValue={t ? hm(t.starts_at) : "20:00"} /></F>
      <F label="Lugares (convidados)"><input name="seats" type="number" min={1} max={12} className={input} defaultValue={t?.seats ?? 8} /></F>
      <F label="Contribuição sugerida (R$)"><input name="suggested_amount" inputMode="decimal" className={input} defaultValue={t?.suggested_amount ?? ""} /></F>
      <F label="Chave Pix"><input name="pix_key" className={input} defaultValue={t?.pix_key ?? ""} /></F>
      <F label="Vinho (aparece só se todos toparem)"><input name="wine_note" className={input} defaultValue={t?.wine_note ?? ""} /></F>
      <F label="Endereço (só aparece depois do sim)" wide><input name="address" className={input} defaultValue={t?.address ?? ""} /></F>
      <F label="Complemento (ex.: interfone 42)" wide><input name="address_notes" className={input} defaultValue={t?.address_notes ?? ""} /></F>
      <F label="Cardápio (privado)" wide><textarea name="menu" rows={3} className={input} defaultValue={t?.menu ?? ""} /></F>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="is_pilot" defaultChecked={t?.is_pilot ?? false} /> Piloto (fora das métricas)</label>
    </div>
  );
}
