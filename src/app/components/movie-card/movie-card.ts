import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../models/movie';

/**
 * Tarjeta de película (póster + título + datos).
 * Se usa en la cartelera y en el top de más vendidas.
 */
@Component({
  imports: [RouterLink],
  selector: 'app-movie-card',
  styleUrl: './movie-card.css',
  templateUrl: './movie-card.html',
})
export class MovieCard {
  readonly movie = input.required<Movie>();
  readonly puesto = input<number | null>(null); // 1, 2, 3 en el top; null en la grilla normal

  readonly generos = computed(() => this.movie().generos.map((g) => g.nombre).join(', '));
}
