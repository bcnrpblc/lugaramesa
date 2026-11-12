/** Guest photo (admin-only route) or initials. */
export function Avatar({ id, name, has, size = 36 }: { id: string; name: string; has: boolean; size?: number }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const style = { width: size, height: size };
  return has
    ? <img src={`/admin/foto/${id}`} alt="" style={style} className="shrink-0 rounded-full object-cover" loading="lazy" />
    : <span style={style} className="grid shrink-0 place-items-center rounded-full bg-cyan text-xs font-bold">{initials}</span>;
}
