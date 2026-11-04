import { Pipe, PipeTransform } from '@angular/core';

const ZONA = 'America/Argentina/Buenos_Aires';

type Formato = 'larga' | 'corta' | 'dia' | 'hora';

/**
 * Muestra fechas siempre en hora argentina, sin importar dónde esté el navegador.
 * Uso: {{ f.starts_at | fechaAr: 'hora' }}
 */
@Pipe({
  name: 'fechaAr',
})
export class FechaArPipe implements PipeTransform {
  transform(value: string | null | undefined, formato: Formato = 'corta'): string {
    if (!value) return '';
    // '2026-11-05' sin hora se toma como medianoche UTC y en Argentina daría el día anterior
    const fecha = new Date(value.length === 10 ? value + 'T12:00:00' : value);

    switch (formato) {
      case 'larga':
        return fecha.toLocaleString('es-AR', {
          weekday: 'long', day: 'numeric', month: 'long',
          hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA,
        });
      case 'dia':
        return fecha.toLocaleDateString('es-AR', {
          weekday: 'short', day: 'numeric', month: 'short', timeZone: ZONA,
        });
      case 'hora':
        return fecha.toLocaleTimeString('es-AR', {
          hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA,
        });
      default:
        return fecha.toLocaleString('es-AR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA,
        });
    }
  }
}
