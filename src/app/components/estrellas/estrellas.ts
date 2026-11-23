import { Component, computed, input, output, signal } from '@angular/core';

/**
 * Estrellas de 1 a 5.
 * - Solo lectura: <app-estrellas [valor]="4.3" />  (redondea a media estrella)
 * - Para votar:   <app-estrellas [valor]="x" [editable]="true" (cambio)="x = $event" />
 */
@Component({
  imports: [],
  selector: 'app-estrellas',
  styleUrl: './estrellas.css',
  templateUrl: './estrellas.html',
})
export class Estrellas {
  readonly valor = input(0);
  readonly editable = input(false);
  readonly tamanio = input<'chico' | 'grande'>('chico');

  readonly cambio = output<number>();

  // Mientras pasa el mouse se muestra lo que va a votar
  readonly hover = signal(0);

  readonly mostrado = computed(() => (this.editable() && this.hover()) || this.valor());

  readonly posiciones = [1, 2, 3, 4, 5];

  /** 'llena' | 'media' | 'vacia' para la estrella n */
  estado(n: number): string {
    const v = Math.round(this.mostrado() * 2) / 2;
    if (v >= n) return 'llena';
    if (v >= n - 0.5) return 'media';
    return 'vacia';
  }

  elegir(n: number) {
    if (this.editable()) this.cambio.emit(n);
  }
}
