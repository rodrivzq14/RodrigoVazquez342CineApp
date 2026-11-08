import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CandyService } from '../../../services/candy.service';
import { SettingsService } from '../../../services/settings.service';
import { Combo, Product } from '../../../models/product';

@Component({
  imports: [ReactiveFormsModule, CurrencyPipe],
  selector: 'app-admin-combos',
  styleUrl: './admin-combos.css',
  templateUrl: './admin-combos.html',
})
export class AdminCombos {
  private candy = inject(CandyService);
  private settings = inject(SettingsService);
  private fb = inject(FormBuilder).nonNullable;

  readonly combos = signal<Combo[]>([]);
  readonly productos = signal<Product[]>([]);
  readonly precioEntrada = signal(0);
  readonly error = signal('');
  readonly guardando = signal(false);

  // undefined = form cerrado, null = combo nuevo
  readonly editando = signal<Combo | null | undefined>(undefined);

  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(1)]],
    imagen_url: ['', Validators.pattern(/^(https?:\/\/.+)?$/)],
    activo: [true],
    // una fila por producto del combo
    items: this.fb.array([this.nuevoItem()]),
  });

  private valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /** Lo que costaría todo por separado: entrada general + productos */
  readonly precioSuelto = computed(() => {
    const items = this.valores().items ?? [];
    const productos = items.reduce((total, i) => {
      const p = this.productos().find((x) => x.id === Number(i.product_id));
      return total + (p ? p.precio * Number(i.cantidad ?? 0) : 0);
    }, 0);
    return this.precioEntrada() + productos;
  });

  readonly ahorro = computed(() => this.precioSuelto() - Number(this.valores().precio ?? 0));

  constructor() {
    this.cargar();
  }

  private nuevoItem(product_id = 0, cantidad = 1) {
    return this.fb.group({
      product_id: [product_id, Validators.min(1)],
      cantidad: [cantidad, [Validators.required, Validators.min(1), Validators.max(10)]],
    });
  }

  private async cargar() {
    try {
      const [combos, productos, precios] = await Promise.all([
        this.candy.getCombos(false),
        this.candy.getProductos(),
        this.settings.getPrecios(),
      ]);
      this.combos.set(combos);
      this.productos.set(productos);
      this.precioEntrada.set(precios.normal);
    } catch {
      this.error.set('No se pudieron cargar los combos');
    }
  }

  agregarItem() {
    this.form.controls.items.push(this.nuevoItem());
  }

  quitarItem(i: number) {
    if (this.form.controls.items.length > 1) this.form.controls.items.removeAt(i);
  }

  abrir(c: Combo | null) {
    this.error.set('');
    this.editando.set(c);
    const items = this.form.controls.items;
    items.clear();

    if (c) {
      c.items.forEach((i) => items.push(this.nuevoItem(i.product_id, i.cantidad)));
      this.form.patchValue({ ...c, descripcion: c.descripcion ?? '', imagen_url: c.imagen_url ?? '' });
    } else {
      items.push(this.nuevoItem());
      this.form.reset();
    }
  }

  async guardar() {
    if (this.form.invalid) return this.form.markAllAsTouched();

    const { items, ...datos } = this.form.getRawValue();
    const ids = items.map((i) => Number(i.product_id));
    if (new Set(ids).size !== ids.length) {
      this.error.set('Hay un producto repetido, sumale cantidad en vez de agregarlo dos veces');
      return;
    }

    this.guardando.set(true);
    this.error.set('');
    try {
      await this.candy.guardarCombo(
        { ...datos, precio: Number(datos.precio), descripcion: datos.descripcion || null, imagen_url: datos.imagen_url || null },
        items.map((i) => ({ product_id: Number(i.product_id), cantidad: Number(i.cantidad) })),
        this.editando()?.id,
      );
      this.editando.set(undefined);
      this.combos.set(await this.candy.getCombos(false));
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo guardar el combo');
    } finally {
      this.guardando.set(false);
    }
  }

  async toggleActivo(c: Combo) {
    try {
      const { id, items, ...datos } = c;
      await this.candy.guardarCombo({ ...datos, activo: !c.activo }, items, id);
      this.combos.update((lista) => lista.map((x) => (x.id === c.id ? { ...x, activo: !c.activo } : x)));
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo cambiar el estado');
    }
  }
}
