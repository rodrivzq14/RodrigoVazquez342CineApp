import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CanjeService } from '../../../services/canje.service';
import { CandyService } from '../../../services/candy.service';
import { Recompensa, TipoRecompensa } from '../../../models/canje';
import { Product } from '../../../models/product';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-admin-canjes',
  styleUrl: './admin-canjes.css',
  templateUrl: './admin-canjes.html',
})
export class AdminCanjes {
  private canjeService = inject(CanjeService);
  private candy = inject(CandyService);
  private fb = inject(FormBuilder).nonNullable;

  readonly recompensas = signal<Recompensa[]>([]);
  readonly productos = signal<Product[]>([]);
  readonly error = signal('');
  readonly mensaje = signal('');

  form = this.fb.group({
    tipo: ['entrada' as TipoRecompensa],
    product_id: [0],
    puntos: [500, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    this.cargar();
  }

  private async cargar() {
    try {
      const [recompensas, productos] = await Promise.all([
        this.canjeService.getRecompensas(false),
        this.candy.getProductos(),
      ]);
      this.recompensas.set(recompensas);
      this.productos.set(productos);
    } catch {
      this.error.set('No se pudieron cargar los canjes');
    }
  }

  async crear() {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const { tipo, product_id, puntos } = this.form.getRawValue();

    let nombre = 'Entrada general gratis';
    if (tipo === 'producto') {
      const p = this.productos().find((x) => x.id === Number(product_id));
      if (!p) {
        this.error.set('Elegí el producto');
        return;
      }
      nombre = p.nombre;
    }

    this.error.set('');
    try {
      await this.canjeService.guardarRecompensa({
        nombre, tipo, puntos: Number(puntos), activo: true,
        product_id: tipo === 'producto' ? Number(product_id) : null,
      });
      this.mensaje.set(`"${nombre}" agregado a los canjes`);
      this.form.reset();
      await this.cargar();
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo crear');
    }
  }

  async cambiarPuntos(r: Recompensa, valor: string) {
    const puntos = Number(valor);
    if (!puntos || puntos < 1 || puntos === r.puntos) return;
    await this.guardar(r, { puntos }, `"${r.nombre}" ahora cuesta ${puntos} puntos`);
  }

  async toggleActivo(r: Recompensa) {
    await this.guardar(r, { activo: !r.activo }, r.activo ? `"${r.nombre}" pausado` : `"${r.nombre}" activado`);
  }

  private async guardar(r: Recompensa, cambios: Partial<Recompensa>, ok: string) {
    this.error.set('');
    this.mensaje.set('');
    try {
      const { id, ...datos } = { ...r, ...cambios };
      await this.canjeService.guardarRecompensa(datos, id);
      this.recompensas.update((lista) => lista.map((x) => (x.id === id ? { ...x, ...cambios } : x)));
      this.mensaje.set(ok);
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo guardar');
    }
  }
}
