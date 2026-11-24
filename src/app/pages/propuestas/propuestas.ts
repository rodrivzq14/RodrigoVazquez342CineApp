import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PropuestaService } from '../../services/propuesta.service';
import { FechaArPipe } from '../../pipes/fecha-ar-pipe';
import { Propuesta } from '../../models/propuesta';

@Component({
  imports: [ReactiveFormsModule, FechaArPipe],
  selector: 'app-propuestas',
  styleUrl: './propuestas.css',
  templateUrl: './propuestas.html',
})
export class Propuestas {
  private propuestas = inject(PropuestaService);
  private fb = inject(FormBuilder).nonNullable;

  readonly mias = signal<Propuesta[]>([]);
  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

  // Solo se puede tener una pendiente a la vez (la base también lo controla)
  readonly pendiente = computed(() => this.mias().find((p) => p.estado === 'pendiente') ?? null);

  form = this.fb.group({
    titulo: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: ['', [Validators.required, Validators.maxLength(1000)]],
    motivo: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
  });

  constructor() {
    this.cargar();
  }

  private async cargar() {
    try {
      this.mias.set(await this.propuestas.misPropuestas());
    } catch {
      this.error.set('No pudimos cargar tus propuestas');
    } finally {
      this.cargando.set(false);
    }
  }

  async enviar() {
    if (this.form.invalid) return this.form.markAllAsTouched();

    this.enviando.set(true);
    this.error.set('');
    this.mensaje.set('');
    try {
      const { titulo, descripcion, motivo } = this.form.getRawValue();
      await this.propuestas.proponer(titulo.trim(), descripcion.trim(), motivo.trim());
      this.form.reset();
      this.mensaje.set('¡Gracias! Te avisamos cuando la revisemos.');
      await this.cargar();
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo enviar la propuesta');
    } finally {
      this.enviando.set(false);
    }
  }

  async retirar(p: Propuesta) {
    if (!confirm(`¿Retirar tu propuesta de "${p.titulo}"?`)) return;
    try {
      await this.propuestas.retirar(p.id);
      await this.cargar();
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo retirar');
    }
  }
}
