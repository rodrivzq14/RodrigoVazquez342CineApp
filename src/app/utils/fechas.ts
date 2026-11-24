const ZONA = 'America/Argentina/Buenos_Aires';

/** Hoy en Argentina como 'yyyy-mm-dd' (igual que las fechas de estreno que vienen de la base) */
export function hoyAr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: ZONA });
}

/** '2026-11-30' + n días -> '2026-12-03' */
export function sumarDias(iso: string, dias: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('en-CA', { timeZone: ZONA });
}

/** El día que abre la venta: el estreno, o 7 días antes si tiene preventa (igual que apertura_venta en la base) */
export function aperturaVenta(estreno: string | null, preventa: number | null): string | null {
  if (!estreno) return null;
  return preventa ? sumarDias(estreno, -7) : estreno;
}
