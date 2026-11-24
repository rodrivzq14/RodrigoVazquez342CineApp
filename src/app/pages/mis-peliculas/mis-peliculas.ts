import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { Estrellas } from '../../components/estrellas/estrellas';
import { FechaArPipe } from '../../pipes/fecha-ar-pipe';

interface PeliculaVista {
  movie_id: number;
  titulo: string;
  poster_url: string;
  ultima: string; // última vez que la vio
  veces: number;
  estrellas: number | null; // su calificación, si dejó reseña
}

@Component({
  imports: [RouterLink, Estrellas, FechaArPipe],
  selector: 'app-mis-peliculas',
  styleUrl: './mis-peliculas.css',
  templateUrl: './mis-peliculas.html',
})
export class MisPeliculas {
  private supabase = inject(SupabaseService).client;

  readonly peliculas = signal<PeliculaVista[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  readonly sinCalificar = computed(() => this.peliculas().filter((p) => !p.estrellas).length);

  constructor() {
    this.cargar();
  }

  private async cargar() {
    const { data, error } = await this.supabase.rpc('mis_peliculas');
    if (error) this.error.set('No pudimos cargar tus películas');
    else this.peliculas.set((data ?? []) as PeliculaVista[]);
    this.cargando.set(false);
  }
}
