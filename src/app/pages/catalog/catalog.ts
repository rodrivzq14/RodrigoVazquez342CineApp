import { Component, computed, inject, signal } from '@angular/core';
import { MovieService } from '../../services/movie.service';
import { Genre, Movie } from '../../models/movie';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-catalog',
  imports: [RouterLink],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog {
  private movieService = inject(MovieService);

  readonly movies = signal<Movie[]>([]);
  readonly genres = signal<Genre[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  // Estado de los filtros
  readonly texto = signal('');
  readonly generosElegidos = signal<Set<number>>(new Set());

  // Se recalcula sola cuando cambia cualquier signal que usa
  readonly filtradas = computed(() => {
    const texto = this.texto().trim().toLowerCase();
    const elegidos = this.generosElegidos();

    return this.movies().filter((m) => {
      const coincideTexto = m.titulo.toLowerCase().includes(texto);
      const coincideGenero =
        elegidos.size === 0 || m.generos.some((g) => elegidos.has(g.id));
      return coincideTexto && coincideGenero;
    });
  });

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