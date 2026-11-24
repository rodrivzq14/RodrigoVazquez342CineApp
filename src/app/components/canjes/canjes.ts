import { Component, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CanjeService } from '../../services/canje.service';
import { FechaArPipe } from '../../pipes/fecha-ar-pipe';
import { Canje, Recompensa } from '../../models/canje';

/**
 * Canje de puntos: recompensas disponibles + historial de canjes.
 * Recibe los puntos del usuario y avisa al padre cuando canjea (para que actualice saldos).
 */
@Component({
  imports: [DecimalPipe, FechaArPipe],
  selector: 'app-canjes',
  styleUrl: './canjes.css',
  templateUrl: './canjes.html',
})
export class Canjes {
  private canjeService = inject(CanjeService);

  readonly puntos = input.required<number>();
  readonly canjeado = output<void>();

  readonly recompensas = signal<Recompensa[]>([]);
  readonly historial = signal<Canje[]>([]);
  readonly mensaje = signal('');
  readonly error = signal('');
  readonly canjeando = signal<number | null>(null);

  constructor() {
    this.cargar();
  }

  private async cargar() {
    try {
      const [recompensas, historial] = await Promise.all([
        this.canjeService.getRecompensas(),
        this.canjeService.misCanjes(),
      ]);
      this.recompensas.set(recompensas);
      this.historial.set(historial);
    } catch {
      // si la base todavía no tiene canjes, la sección no se muestra
    }
  }

  async canjear(r: Recompensa) {
    if (!confirm(`¿Canjear ${r.puntos} puntos por "${r.nombre}"?`)) return;

    this.canjeando.set(r.id);
    this.mensaje.set('');
    this.error.set('');
    try {
      const res = await this.canjeService.canjear(r.id);
      this.mensaje.set(
        res.tipo === 'entrada'
          ? `¡Listo! Te acreditamos $${res.credito.toLocaleString('es-AR')}: tu próxima entrada general te sale gratis.`
          : `¡Listo! Retiralo en el candy bar con el código ${res.codigo.slice(0, 8)}.`,
      );
      this.canjeado.emit();
      await this.cargar();
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo canjear');
    } finally {
      this.canjeando.set(null);
    }
  }
}
