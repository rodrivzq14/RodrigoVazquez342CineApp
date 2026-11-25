import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MovieService } from '../../../services/movie.service';
import { PropuestaService } from '../../../services/propuesta.service';
import { MovieForm } from '../../../components/movie-form/movie-form';
import { Genre, Movie } from '../../../models/movie';

@Component({
  imports: [MovieForm],
  selector: 'app-admin-movies',
  styleUrl: './admin-movies.css',
  templateUrl: './admin-movies.html',
})
export class AdminMovies implements OnInit {
  private movieService = inject(MovieService);
  private router = inject(Router);
  private propuestas = inject(PropuestaService);

  readonly movies = signal<Movie[]>([]);
  readonly generos = signal<Genre[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly texto = signal('');

  // undefined = form cerrado, null = película nueva, Movie = editando esa
  readonly editando = signal<Movie | null | undefined>(undefined);

  // Query params (withComponentInputBinding): vienen de aceptar una propuesta
  readonly propuesta = input<string>();
  readonly titulo = input<string>();
  readonly sinopsis = input<string>();
  readonly borrador = computed(() => (this.titulo() ? { titulo: this.titulo()!, sinopsis: this.sinopsis() ?? '' } : null));

  readonly filtradas = computed(() => {
    const t = this.texto().trim().toLowerCase();
    return this.movies().filter((m) => m.titulo.toLowerCase().includes(t));
  });

  ngOnInit() {
    if (this.borrador()) this.editando.set(null); // abre el formulario de película nueva
  }

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

  /** Cierra el formulario y, si venía de una propuesta, limpia los datos de la URL */
  cerrar() {
    this.editando.set(undefined);
    if (this.titulo()) this.router.navigate([], { queryParams: {} });
  }

  async alGuardar() {
    const propuesta = this.propuesta(); // se lee antes de cerrar, que limpia la URL
    this.cerrar();
    if (propuesta) {
      try {
        await this.propuestas.resolver(Number(propuesta), 'aceptada');
      } catch (e: any) {
        this.error.set(e.message ?? 'La película se guardó pero no se pudo aceptar la propuesta');
      }
    }
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
