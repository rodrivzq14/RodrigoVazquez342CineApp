import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';
import { Estrellas } from '../estrellas/estrellas';
import { FechaArPipe } from '../../pipes/fecha-ar-pipe';
import { Rating, Review } from '../../models/review';

/**
 * Lista de reseñas de una película + formulario para dejar la propia.
 * Cada vez que alguien guarda o borra, avisa al padre con el promedio nuevo.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink, Estrellas, FechaArPipe],
  selector: 'app-resenas',
  styleUrl: './resenas.css',
  templateUrl: './resenas.html',
})
export class Resenas {
  private reviews = inject(ReviewService);
  readonly auth = inject(AuthService);

  readonly movieId = input.required<number>();
  readonly ratingCambio = output<Rating | null>();

  readonly lista = signal<Review[]>([]);
  readonly estrellas = signal(0);
  readonly editando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');

  // FormGroup aunque tenga un solo campo: sin [formGroup] el <form> hace el submit
  // nativo del navegador y recarga la página
  form = new FormGroup({
    comentario: new FormControl('', { nonNullable: true, validators: Validators.maxLength(280) }),
  });
  comentario = this.form.controls.comentario;

  readonly mia = computed(() => this.lista().find((r) => r.es_mia) ?? null);
  readonly otras = computed(() => this.lista().filter((r) => !r.es_mia));

  constructor() {
    // Se carga cuando llega el id (y de nuevo si cambia la película)
    effect(() => {
      this.cargar(this.movieId());
    });
  }

  private async cargar(movieId: number) {
    try {
      this.lista.set(await this.reviews.getResenas(movieId));
    } catch {
      this.error.set('No se pudieron cargar las reseñas');
    }
  }

  editar() {
    const r = this.mia();
    this.estrellas.set(r?.estrellas ?? 0);
    this.comentario.setValue(r?.comentario ?? '');
    this.editando.set(true);
  }

  async guardar() {
    if (this.estrellas() === 0) {
      this.error.set('Elegí cuántas estrellas le das');
      return;
    }
    if (this.comentario.invalid) return;

    this.guardando.set(true);
    this.error.set('');
    try {
      await this.reviews.guardar(this.movieId(), this.estrellas(), this.comentario.value.trim());
      this.editando.set(false);
      await this.recargar();
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo guardar la reseña');
    } finally {
      this.guardando.set(false);
    }
  }

  async borrar() {
    const r = this.mia();
    if (!r || !confirm('¿Borrar tu reseña?')) return;
    try {
      await this.reviews.borrar(r.id);
      await this.recargar();
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo borrar');
    }
  }

  private async recargar() {
    await this.cargar(this.movieId());
    this.ratingCambio.emit(await this.reviews.getRating(this.movieId()));
  }
}
