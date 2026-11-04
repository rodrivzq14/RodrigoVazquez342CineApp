import { Component, computed, inject, signal } from '@angular/core';
import { MovieService } from '../../../services/movie.service';
import { MovieForm } from '../../../components/movie-form/movie-form';
import { Genre, Movie } from '../../../models/movie';

@Component({
  imports: [MovieForm],
  selector: 'app-admin-movies',
  styleUrl: './admin-movies.css',
  templateUrl: './admin-movies.html',
})
export class AdminMovies {
  private movieService = inject(MovieService);

  readonly movies = signal<Movie[]>([]);
  readonly generos = signal<Genre[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly texto = signal('');

  // undefined = form cerrado, null = película nueva, Movie = editando esa
  readonly editando = signal<Movie | null | undefined>(undefined);

  readonly filtradas = computed(() => {
    const t = this.texto().trim().toLowerCase();
    return this.movies().filter((m) => m.titulo.toLowerCase().includes(t));
  });

  constructor() {
    this.cargar();
  }

  async cargar() {
    try {
      const [movies, generos] = await Promise.all([
        this.movieService.getMovies(false),
        this.movieService.getGenres(),
      ]);
      this.movies.set(movies);
      this.generos.set(generos);
    } catch {
      this.error.set('No se pudieron cargar las películas');
    } finally {
      this.cargando.set(false);
    }
  }

  async alGuardar() {
    this.editando.set(undefined);
    await this.cargar();
  }

  async toggleActiva(m: Movie) {
    try {
      await this.movieService.setActiva(m.id, !m.activa);
      // actualizamos solo esa fila para no recargar todo
      this.movies.update((lista) => lista.map((x) => (x.id === m.id ? { ...x, activa: !m.activa } : x)));
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo cambiar el estado');
    }
  }

  nombresGeneros(m: Movie): string {
    return m.generos.map((g) => g.nombre).join(', ');
  }
}
