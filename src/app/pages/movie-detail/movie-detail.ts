import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MovieService } from '../../services/movie.service';
import { ScreeningService } from '../../services/screening.service';
import { Movie } from '../../models/movie';
import { Screening } from '../../models/screening';

const ZONA = 'America/Argentina/Buenos_Aires';

interface Dia {
  key: string;
  label: string;
  funciones: Screening[];
}

@Component({
  selector: 'app-movie-detail',
  imports: [RouterLink],
  templateUrl: './movie-detail.html',
  styleUrl: './movie-detail.css',
})
export class MovieDetail implements OnInit {
  private movieService = inject(MovieService);
  private screeningService = inject(ScreeningService);

  readonly id = input.required<string>(); // viene de la URL /pelicula/:id

  readonly movie = signal<Movie | null>(null);
  readonly funciones = signal<Screening[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly diaElegido = signal<string | null>(null);

  // Agrupa las funciones por día (en hora argentina)
  readonly dias = computed<Dia[]>(() => {
    const mapa = new Map<string, Dia>();
    for (const f of this.funciones()) {
      const fecha = new Date(f.starts_at);
      const key = fecha.toLocaleDateString('en-CA', { timeZone: ZONA }); // 2026-10-05
      if (!mapa.has(key)) {
        const label = fecha.toLocaleDateString('es-AR', {
          weekday: 'short', day: 'numeric', month: 'short', timeZone: ZONA,
        });
        mapa.set(key, { key, label, funciones: [] });
      }
      mapa.get(key)!.funciones.push(f);
    }
    return [...mapa.values()];
  });

  // Si no eligió ninguno, muestra el primero
  readonly diaActivo = computed(() => {
    const dias = this.dias();
    return dias.find((d) => d.key === this.diaElegido()) ?? dias[0] ?? null;
  });

  async ngOnInit() {
    try {
      const movieId = Number(this.id());
      const [movie, funciones] = await Promise.all([
        this.movieService.getMovie(movieId),
        this.screeningService.getUpcoming(movieId),
      ]);
      this.movie.set(movie);
      this.funciones.set(funciones);
    } catch {
      this.error.set('No pudimos cargar la película');
    } finally {
      this.cargando.set(false);
    }
  }

  hora(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-AR', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA,
    });
  }
}