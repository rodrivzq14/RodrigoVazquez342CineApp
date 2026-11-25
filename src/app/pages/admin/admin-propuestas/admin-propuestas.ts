import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PropuestaService } from '../../../services/propuesta.service';
import { AuthService } from '../../../services/auth.service';
import { FechaArPipe } from '../../../pipes/fecha-ar-pipe';
import { EstadoPropuesta, PropuestaAdmin } from '../../../models/propuesta';

@Component({
  imports: [FechaArPipe],
  selector: 'app-admin-propuestas',
  styleUrl: './admin-propuestas.css',
  templateUrl: './admin-propuestas.html',
})
export class AdminPropuestas {
  private propuestas = inject(PropuestaService);
  private router = inject(Router);
  readonly auth = inject(AuthService);

  readonly lista = signal<PropuestaAdmin[]>([]);
  readonly filtro = signal<EstadoPropuesta>('pendiente');
  readonly error = signal('');
  readonly procesando = signal<number | null>(null);

  readonly filtradas = computed(() => this.lista().filter((p) => p.estado === this.filtro()));
  readonly cantidadPendientes = computed(() => this.lista().filter((p) => p.estado === 'pendiente').length);

  readonly estados: { valor: EstadoPropuesta; nombre: string }[] = [
    { valor: 'pendiente', nombre: 'Pendientes' },
    { valor: 'aceptada', nombre: 'Aceptadas' },
    { valor: 'rechazada', nombre: 'Rechazadas' },
  ];

  constructor() {
    this.cargar();
  }

  private async cargar() {
    try {
      this.lista.set(await this.propuestas.todas());
    } catch {
      this.error.set('No se pudieron cargar las propuestas');
    }
  }

  async aceptar(p: PropuestaAdmin) {
    this.procesando.set(p.id);
    this.error.set('');
    try {
      // Si puede cargar películas, la propuesta se acepta recién cuando guarda la película
      // (antes se aceptaba acá y si cancelaba el alta quedaba aceptada sin película)
      if (this.auth.puede('peliculas')) {
        this.router.navigate(['/admin/peliculas'], {
          queryParams: { propuesta: p.id, titulo: p.titulo, sinopsis: p.descripcion },
        });
      } else {
        await this.propuestas.resolver(p.id, 'aceptada');
        await this.cargar();
      }
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo aceptar');
    } finally {
      this.procesando.set(null);
    }
  }

  async rechazar(p: PropuestaAdmin) {
    const respuesta = prompt(`¿Por qué se rechaza "${p.titulo}"? (opcional, le llega al cliente)`, '');
    if (respuesta === null) return; // tocó cancelar

    this.procesando.set(p.id);
    this.error.set('');
    try {
      await this.propuestas.resolver(p.id, 'rechazada', respuesta);
      await this.cargar();
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo rechazar');
    } finally {
      this.procesando.set(null);
    }
  }
}
