import { Component, computed, inject, signal } from '@angular/core';
import { MovieService } from '../../services/movie.service';
import { ReviewService } from '../../services/review.service';
import { Genre, Movie } from '../../models/movie';
import { Rating } from '../../models/review';
import { hoyAr } from '../../utils/fechas';
import { RouterLink } from '@angular/router';
import { MovieCard } from '../../components/movie-card/movie-card';

// "Órbita" -> "orbita", así buscar "orbita" u "orb" la encuentra igual
function sinAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

@Component({
  selector: 'app-catalog',
  imports: [MovieCard, RouterLink],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog {
  private movieService = inject(MovieService);
  private reviewService = inject(ReviewService);

  readonly movies = signal<Movie[]>([]);
  readonly genres = signal<Genre[]>([]);
  readonly topIds = signal<number[]>([]);
  readonly ratings = signal<Map<number, Rating>>(new Map());
  readonly cargando = signal(true);
  readonly error = signal('');

  // Estado de los filtros
  readonly texto = signal('');
  readonly generosElegidos = signal<Set<number>>(new Set());

  readonly filtrando = computed(() => this.texto().trim() !== '' || this.generosElegidos().size > 0);

  // Próximamente: las que todavía no se estrenaron (ordenadas por fecha de estreno)
  readonly proximas = computed(() =>
    this.movies()
      .filter((m) => m.fecha_estreno && m.fecha_estreno > hoyAr())
      .sort((a, b) => a.fecha_estreno!.localeCompare(b.fecha_estreno!)),
  );

  // Se recalcula sola cuando cambia cualquier signal que usa
  readonly filtradas = computed(() => {
    const texto = sinAcentos(this.texto().trim());
    const elegidos = this.generosElegidos();

    const proximas = new Set(this.proximas().map((m) => m.id));
    return this.movies().filter((m) => {
      if (proximas.has(m.id)) return false; // van en su propia sección
      const coincideTexto = sinAcentos(m.titulo).includes(texto);
      const coincideGenero =
        elegidos.size === 0 || m.generos.some((g) => elegidos.has(g.id));
      return coincideTexto && coincideGenero;
    });
  });

  // Las más vendidas, en el orden que vienen de la base
  readonly top = computed(() =>
    this.topIds()
      .map((id) => this.movies().find((m) => m.id === id))
      .filter((m): m is Movie => !!m),
  );

  constructor() {
    this.cargar();
  }

  private async cargar() {
    try {
      const [movies, genres] = await Promise.all([
        this.movieService.getMovies(),
        this.movieService.getGenres(),
      ]);
      this.movies.set(movies);
      this.genres.set(genres);
    } catch {
      this.error.set('No pudimos cargar la cartelera');
    } finally {
      this.cargando.set(false);
    }

    // Si falla el top o los promedios no rompemos la cartelera, simplemente no se muestran
    try {
      const [top, ratings] = await Promise.all([
        this.movieService.getMasVendidas(3),
        this.reviewService.getRatings(),
      ]);
      this.topIds.set(top);
      this.ratings.set(ratings);
    } catch {
      this.topIds.set([]);
    }
  }

  promedio(movieId: number): number | null {
    return this.ratings().get(movieId)?.promedio ?? null;
  }

  toggleGenero(id: number) {
    // Creamos un Set nuevo: los signals detectan el cambio por referencia
    const nuevo = new Set(this.generosElegidos());
    nuevo.has(id) ? nuevo.delete(id) : nuevo.add(id);
    this.generosElegidos.set(nuevo);
  }

  limpiar() {
    this.texto.set('');
    this.generosElegidos.set(new Set());
  }
}
