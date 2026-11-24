import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../models/movie';
import { Estrellas } from '../estrellas/estrellas';
import { hoyAr } from '../../utils/fechas';

/**
 * Tarjeta de película (póster + título + datos).
 * Se usa en la cartelera y en el top de más vendidas.
 */
@Component({
  imports: [RouterLink, Estrellas],
  selector: 'app-movie-card',
  styleUrl: './movie-card.css',
  templateUrl: './movie-card.html',
})
export class MovieCard {
  readonly movie = input.required<Movie>();
  readonly puesto = input<number | null>(null); // 1, 2, 3 en el top; null en la grilla normal
  readonly promedio = input<number | null>(null); // estrellas promedio, si tiene reseñas

  // Si todavía no se estrenó, la tarjeta muestra la fecha de estreno
  readonly proximamente = computed(() => {
    const estreno = this.movie().fecha_estreno;
    return estreno && estreno > hoyAr() ? estreno : null;
  });

  readonly generos = computed(() => this.movie().generos.map((g) => g.nombre).join(', '));
}
