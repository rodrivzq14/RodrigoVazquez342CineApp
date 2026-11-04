import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MovieService } from '../../services/movie.service';
import { Genre, Movie } from '../../models/movie';

/**
 * Formulario para crear o editar una película.
 * Recibe la película a editar (o null para crear una nueva) y avisa al padre cuando termina.
 */
@Component({
  selector: 'app-movie-form',
  imports: [ReactiveFormsModule],
  templateUrl: './movie-form.html',
  styleUrl: './movie-form.css',
})
export class MovieForm {
  private fb = inject(FormBuilder).nonNullable;
  private movieService = inject(MovieService);

  readonly movie = input<Movie | null>(null);
  readonly generos = input.required<Genre[]>();

  readonly guardado = output<void>();
  readonly cancelado = output<void>();

  readonly elegidos = signal<Set<number>>(new Set());
  readonly error = signal('');
  readonly guardando = signal(false);

  form = this.fb.group({
    titulo: ['', Validators.required],
    sinopsis: ['', [Validators.required, Validators.maxLength(1000)]],
    duracion_min: [90, [Validators.required, Validators.min(30), Validators.max(300)]],
    poster_url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    edad_minima: [0, Validators.required],
    fecha_estreno: [''],
    activa: [true],
  });

  constructor() {
    // Cada vez que el padre manda otra película, cargamos sus datos en el form
    effect(() => {
      const m = this.movie();
      this.error.set('');
      if (m) {
        this.form.reset({
          titulo: m.titulo,
          sinopsis: m.sinopsis,
          duracion_min: m.duracion_min,
          poster_url: m.poster_url,
          edad_minima: m.edad_minima,
          fecha_estreno: m.fecha_estreno ?? '',
          activa: m.activa,
        });
        this.elegidos.set(new Set(m.generos.map((g) => g.id)));
      } else {
        this.form.reset();
        this.elegidos.set(new Set());
      }
    });
  }

  toggleGenero(id: number) {
    const nuevo = new Set(this.elegidos());
    nuevo.has(id) ? nuevo.delete(id) : nuevo.add(id);
    this.elegidos.set(nuevo);
  }

  async guardar() {
    if (this.form.invalid) return this.form.markAllAsTouched();
    if (this.elegidos().size === 0) {
      this.error.set('Elegí al menos un género');
      return;
    }

    this.guardando.set(true);
    this.error.set('');
    try {
      const datos = this.form.getRawValue();
      await this.movieService.guardar(
        { ...datos, edad_minima: Number(datos.edad_minima), fecha_estreno: datos.fecha_estreno || null },
        [...this.elegidos()],
        this.movie()?.id,
      );
      this.guardado.emit();
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo guardar la película');
    } finally {
      this.guardando.set(false);
    }
  }
}
