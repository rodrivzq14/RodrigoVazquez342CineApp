import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Html5Qrcode } from 'html5-qrcode';
import { CandyEntregado, EntradaValidada, TicketService } from '../../services/ticket.service';
import { FechaArPipe } from '../../pipes/fecha-ar-pipe';
import { CanjeService } from '../../services/canje.service';

@Component({
  imports: [ReactiveFormsModule, FechaArPipe],
  selector: 'app-validate',
  styleUrl: './validate.css',
  templateUrl: './validate.html',
})
export class Validate {
  private tickets = inject(TicketService);
  private canjes = inject(CanjeService);
  private fb = inject(FormBuilder).nonNullable;

  // El mismo QR sirve en la puerta de la sala y en el candy: el empleado elige dónde está
  readonly modo = signal<'sala' | 'candy'>('sala');

  readonly camaraActiva = signal(false);
  readonly procesando = signal(false);
  readonly valida = signal<EntradaValidada | null>(null);
  readonly candy = signal<CandyEntregado | null>(null);
  readonly canje = signal<{ nombre: string; puntos: number } | null>(null);
  readonly error = signal('');

  private lector: Html5Qrcode | null = null;

  form = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    // apagar la cámara si el empleado se va de la página
    inject(DestroyRef).onDestroy(() => this.apagarCamara());
  }

  async prenderCamara() {
    this.error.set('');
    try {
      this.lector = new Html5Qrcode('lector');
      this.camaraActiva.set(true);
      await this.lector.start(
        { facingMode: 'environment' }, // cámara trasera en el celular
        { fps: 10, qrbox: 240 },
        (texto) => this.alLeer(texto),
        () => {}, // se llama en cada frame sin QR, no nos interesa
      );
    } catch {
      this.camaraActiva.set(false);
      this.error.set('No se pudo acceder a la cámara. Podés ingresar el código a mano.');
    }
  }

  async apagarCamara() {
    if (this.lector?.isScanning) await this.lector.stop();
    this.lector = null;
    this.camaraActiva.set(false);
  }

  private async alLeer(texto: string) {
    if (this.procesando()) return; // el lector dispara varias veces el mismo QR
    this.lector?.pause(true);
    await this.validar(texto);
  }

  async validarManual() {
    if (this.form.invalid) return this.form.markAllAsTouched();
    await this.validar(this.form.controls.codigo.value);
  }

  private async validar(codigo: string) {
    this.procesando.set(true);
    this.valida.set(null);
    this.candy.set(null);
    this.canje.set(null);
    this.error.set('');
    try {
      if (this.modo() === 'sala') {
        this.valida.set(await this.tickets.validar(codigo));
      } else {
        try {
          this.candy.set(await this.tickets.entregarCandy(codigo));
        } catch (e: any) {
          // Si no es el código de una entrada, puede ser un canje de puntos
          if (!e.message?.includes('No existe ninguna entrada')) throw e;
          try {
            this.canje.set(await this.canjes.validar(codigo));
          } catch (e2: any) {
            // si tampoco es un canje, el mensaje tiene que hablar de los dos
            if (e2.message?.includes('No existe ningún canje')) throw new Error('No existe ninguna entrada ni canje con ese código');
            throw e2;
          }
        }
      }
      this.form.reset();
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo validar');
    } finally {
      this.procesando.set(false);
    }
  }

  cambiarModo(modo: 'sala' | 'candy') {
    this.modo.set(modo);
    this.siguiente();
  }

  siguiente() {
    this.valida.set(null);
    this.candy.set(null);
    this.canje.set(null);
    this.error.set('');
    if (this.lector?.isScanning) this.lector.resume();
  }
}
