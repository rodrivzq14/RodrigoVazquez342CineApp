import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Html5Qrcode } from 'html5-qrcode';
import { EntradaValidada, TicketService } from '../../services/ticket.service';
import { FechaArPipe } from '../../pipes/fecha-ar-pipe';

@Component({
  imports: [ReactiveFormsModule, FechaArPipe],
  selector: 'app-validate',
  styleUrl: './validate.css',
  templateUrl: './validate.html',
})
export class Validate {
  private tickets = inject(TicketService);
  private fb = inject(FormBuilder).nonNullable;

  readonly camaraActiva = signal(false);
  readonly procesando = signal(false);
  readonly valida = signal<EntradaValidada | null>(null);
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
    this.error.set('');
    try {
      this.valida.set(await this.tickets.validar(codigo));
      this.form.reset();
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo validar la entrada');
    } finally {
      this.procesando.set(false);
    }
  }

  siguiente() {
    this.valida.set(null);
    this.error.set('');
    if (this.lector?.isScanning) this.lector.resume();
  }
}
