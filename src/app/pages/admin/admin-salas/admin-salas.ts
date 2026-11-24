import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';

interface Sala {
  id: number;
  nombre: string;
  activa: boolean;
  normales: number;
  vip: number;
  accesibles: number;
  funciones: number; // funciones futuras programadas
}

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-admin-salas',
  styleUrl: './admin-salas.css',
  templateUrl: './admin-salas.html',
})
export class AdminSalas {
  private supabase = inject(SupabaseService).client;
  private fb = inject(FormBuilder).nonNullable;

  readonly salas = signal<Sala[]>([]);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly creando = signal(false);

  form = this.fb.group({ nombre: ['', [Validators.required, Validators.maxLength(40)]] });

  constructor() {
    this.cargar();
  }

  private async cargar() {
    const { data, error } = await this.supabase.rpc('salas_resumen');
    if (error) this.error.set('No se pudieron cargar las salas');
    else this.salas.set((data ?? []) as Sala[]);
  }

  /** create_room arma las butacas con la forma de siempre (ver 12_reportes_salas.sql) */
  async crear() {
    if (this.form.invalid) return this.form.markAllAsTouched();

    this.creando.set(true);
    this.error.set('');
    this.mensaje.set('');
    const nombre = this.form.controls.nombre.value.trim();
    const { error } = await this.supabase.rpc('create_room', { p_nombre: nombre });
    if (error) {
      this.error.set(error.message.includes('duplicate') ? 'Ya existe una sala con ese nombre' : error.message);
    } else {
      this.mensaje.set(`${nombre} creada con sus butacas`);
      this.form.reset();
      await this.cargar();
    }
    this.creando.set(false);
  }

  async toggleActiva(s: Sala) {
    // Desactivada no se le asignan funciones nuevas (generate_screenings solo usa salas activas)
    if (s.activa && s.funciones > 0 && !confirm(`${s.nombre} tiene ${s.funciones} función(es) programadas. Desactivarla no las cancela. ¿Seguir?`)) {
      return;
    }
    const { error } = await this.supabase.from('rooms').update({ activa: !s.activa }).eq('id', s.id);
    if (error) {
      this.error.set(error.message);
      return;
    }
    this.salas.update((lista) => lista.map((x) => (x.id === s.id ? { ...x, activa: !s.activa } : x)));
  }
}
