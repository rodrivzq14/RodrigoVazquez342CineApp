import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeatService } from '../../services/seat.service';
import { ScreeningService } from '../../services/screening.service';
import { SettingsService } from '../../services/settings.service';
import { ScreeningDetail } from '../../models/screening';
import { SeatMapItem, SeatTipo } from '../../models/seat';

type SeatView = SeatMapItem & { etiqueta: string };

const ZONA = 'America/Argentina/Buenos_Aires';
const BLOQUES = ['izq', 'centro', 'der'];

@Component({
  selector: 'app-seat-selection',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.css',
})
export class SeatSelection implements OnInit {
  private seatService = inject(SeatService);
  private screeningService = inject(ScreeningService);
  private settings = inject(SettingsService);
  private destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();

  readonly funcion = signal<ScreeningDetail | null>(null);
  readonly seats = signal<SeatMapItem[]>([]);
  readonly precios = signal({ normal: 0, vip: 0 });
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly aviso = signal('');
  private ocupado = false;

  // Agrupa por fila y numera las butacas de corrido (A1...A28), sin importar el bloque
  readonly filas = computed(() => {
    const porFila = new Map<string, SeatMapItem[]>();
    for (const s of this.seats()) {
      if (!porFila.has(s.fila)) porFila.set(s.fila, []);
      porFila.get(s.fila)!.push(s);
    }
    return [...porFila.entries()].map(([letra, lista]) => {
      let n = 0;
      const bloques: SeatView[][] = BLOQUES.map((b) =>
        lista
          .filter((s) => s.bloque === b)
          .sort((x, y) => x.numero - y.numero)
          .map((s) => ({ ...s, etiqueta: `${letra}${++n}` })),
      );
      return { letra, bloques };
    });
  });

  readonly elegidas = computed(() =>
    this.filas().flatMap((f) => f.bloques.flat()).filter((b) => b.estado === 'mia'),
  );
  readonly cantidadVip = computed(() => this.elegidas().filter((b) => b.tipo === 'vip').length);
  readonly total = computed(() =>
    this.elegidas().reduce((acc, b) => acc + this.precio(b.tipo), 0),
  );

  async ngOnInit() {
    // Escuchar cambios + refresco periódico (las reservas vencen sin generar evento)
    const dejarDeEscuchar = this.seatService.watch(() => this.recargar());
    const timer = setInterval(() => this.recargar(), 30_000);
    this.destroyRef.onDestroy(() => {
      dejarDeEscuchar();
      clearInterval(timer);
    });

    try {
      const [funcion, precios] = await Promise.all([
        this.screeningService.getScreening(Number(this.id())),
        this.settings.getPrecios(),
      ]);
      if (!funcion) {
        this.error.set('La función no existe');
        return;
      }
      this.funcion.set(funcion);
      this.precios.set(precios);
      await this.recargar();
    } catch {
      this.error.set('No pudimos cargar la sala');
    } finally {
      this.cargando.set(false);
    }
  }

  private async recargar() {
    try {
      this.seats.set(await this.seatService.getSeatMap(Number(this.id())));
    } catch {
      this.aviso.set('Problemas de conexión, reintentando...');
    }
  }

  async toggle(b: SeatView) {
    if (this.ocupado) return;
    this.ocupado = true;
    this.aviso.set('');

    try {
      const funcionId = Number(this.id());
      if (b.estado === 'mia') {
        await this.seatService.release(funcionId, b.seat_id);
      } else {
        const ok = await this.seatService.hold(funcionId, b.seat_id);
        if (!ok) this.aviso.set('Esa butaca acaba de ser tomada por otra persona');
      }
      await this.recargar();
    } catch (e: any) {
      this.aviso.set(e.message ?? 'No se pudo reservar la butaca');
    } finally {
      this.ocupado = false;
    }
  }

  precio(tipo: SeatTipo): number {
    return tipo === 'vip' ? this.precios().vip : this.precios().normal;
  }

  nombreTipo(tipo: SeatTipo): string {
    return { normal: 'Normal', vip: 'VIP', accesible: 'Accesible' }[tipo];
  }

  fechaLarga(iso: string): string {
    return new Date(iso).toLocaleString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA,
    });
  }
}