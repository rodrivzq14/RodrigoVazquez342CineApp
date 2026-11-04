import { Component, computed, inject, signal } from '@angular/core';
import { LogService } from '../../../services/log.service';
import { FechaArPipe } from '../../../pipes/fecha-ar-pipe';
import { LogEntry } from '../../../models/log';

@Component({
  imports: [FechaArPipe],
  selector: 'app-admin-log',
  styleUrl: './admin-log.css',
  templateUrl: './admin-log.html',
})
export class AdminLog {
  private logService = inject(LogService);

  readonly entradas = signal<LogEntry[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly filtro = signal('');

  // Las acciones distintas que hay, para armar los chips de filtro
  readonly acciones = computed(() => [...new Set(this.entradas().map((e) => e.accion))].sort());

  readonly filtradas = computed(() => {
    const f = this.filtro();
    return f ? this.entradas().filter((e) => e.accion === f) : this.entradas();
  });

  constructor() {
    this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    try {
      this.entradas.set(await this.logService.getUltimos());
    } catch {
      this.error.set('No se pudo cargar el registro de actividad');
    } finally {
      this.cargando.set(false);
    }
  }
}
