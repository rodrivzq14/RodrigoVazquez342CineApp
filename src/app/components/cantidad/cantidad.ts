import { Component, input, output } from '@angular/core';

/**
 * Selector de cantidad con botones − y +.
 * El padre le pasa el valor y escucha (cambio) para guardar el nuevo.
 */
@Component({
  imports: [],
  selector: 'app-cantidad',
  styleUrl: './cantidad.css',
  templateUrl: './cantidad.html',
})
export class Cantidad {
  readonly valor = input(0);
  readonly max = input(10);
  readonly deshabilitado = input(false);

  readonly cambio = output<number>();

  restar() {
    if (this.valor() > 0) this.cambio.emit(this.valor() - 1);
  }

  sumar() {
    if (this.valor() < this.max()) this.cambio.emit(this.valor() + 1);
  }
}
