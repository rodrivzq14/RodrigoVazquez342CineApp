import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MovieService } from '../../services/movie.service';
import { ScreeningService } from '../../services/screening.service';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';
import { AlertaService } from '../../services/alerta.service';
import { aperturaVenta, hoyAr } from '../../utils/fechas';
import { Estrellas } from '../../components/estrellas/estrellas';
import { Resenas } from '../../components/resenas/resenas';
import { Movie } from '../../models/movie';
import { Screening } from '../../models/screening';
import { Rating } from '../../models/review';

const ZONA = 'America/Argentina/Buenos_Aires';

interface Dia {
  key: string;
  label: string;
  funciones: Screening[];
}

@Component({
  selector: 'app-movie-detail',
  imports: [RouterLink, CurrencyPipe, Estrellas, Resenas],
  templateUrl: './movie-detail.html',
  styleUrl: './movie-detail.css',
})
export class MovieDetail implements OnInit {
  private movieService = inject(MovieService);
  private screeningService = inject(ScreeningService);
  private reviewService = inject(ReviewService);
  readonly auth = inject(AuthService);
  private alertas = inject(AlertaService);

  readonly id = input.required<string>(); // viene de la URL /pelicula/:id

  readonly movie = signal<Movie | null>(null);
  readonly rating = signal<Rating | null>(null);
  readonly tengoAlerta = signal(false);

  // Estreno / preventa: se calcula con las mismas reglas que la base (apertura_venta)
  readonly estrenoFuturo = computed(() => {
    const e = this.movie()?.fecha_estreno;
    return e && e > hoyAr() ? e : null;
  });
  readonly apertura = computed(() => aperturaVenta(this.movie()?.fecha_estreno ?? null, this.movie()?.precio_preventa ?? null));
  readonly ventaAbierta = computed(() => !this.apertura() || this.apertura()! <= hoyAr());
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
      const [movie, funciones, rating] = await Promise.all([
        this.movieService.getMovie(movieId),
        this.screeningService.getUpcoming(movieId),
        this.reviewService.getRating(movieId),
      ]);
      this.movie.set(movie);
      this.funciones.set(funciones);
      this.rating.set(rating);

      await this.auth.ready;
      if (this.auth.isLoggedIn() && this.estrenoFuturo()) {
        this.tengoAlerta.set((await this.alertas.misAlertas().catch(() => new Set<number>())).has(movieId));
      }
    } catch {
      this.error.set('No pudimos cargar la película');
    } finally {
      this.cargando.set(false);
    }
  }

  async toggleAlerta() {
    const id = this.movie()!.id;
    if (this.tengoAlerta()) {
      await this.alertas.desactivar(id);
      this.tengoAlerta.set(false);
    } else {
      await this.alertas.activar(id);
      this.tengoAlerta.set(true);
    }
  }

  /** 2026-11-30 -> 30/11 */
  fechaCorta(iso: string): string {
    return iso.slice(8, 10) + '/' + iso.slice(5, 7);
  }

  hora(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-AR', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA,
    });
  }
}