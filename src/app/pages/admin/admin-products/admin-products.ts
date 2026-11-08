import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CandyService } from '../../../services/candy.service';
import { Category, Product } from '../../../models/product';

@Component({
  imports: [ReactiveFormsModule, CurrencyPipe],
  selector: 'app-admin-products',
  styleUrl: './admin-products.css',
  templateUrl: './admin-products.html',
})
export class AdminProducts {
  private candy = inject(CandyService);
  private fb = inject(FormBuilder).nonNullable;

  readonly categorias = signal<Category[]>([]);
  readonly productos = signal<Product[]>([]);
  readonly categoriaFiltro = signal<number | null>(null);
  readonly error = signal('');
  readonly guardando = signal(false);

  // undefined = form cerrado, null = producto nuevo
  readonly editando = signal<Product | null | undefined>(undefined);

  readonly filtrados = computed(() => {
    const cat = this.categoriaFiltro();
    return cat ? this.productos().filter((p) => p.category_id === cat) : this.productos();
  });

  form = this.fb.group({
    nombre: ['', Validators.required],
    category_id: [0, Validators.min(1)],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(0)]],
    imagen_url: ['', Validators.pattern(/^(https?:\/\/.+)?$/)],
    activo: [true],
  });

  nuevaCategoria = this.fb.control('', Validators.required);

  constructor() {
    this.cargar();
  }

  private async cargar() {
    try {
      const [categorias, productos] = await Promise.all([
        this.candy.getCategorias(),
        this.candy.getProductos(false),
      ]);
      this.categorias.set(categorias);
      this.productos.set(productos);
    } catch {
      this.error.set('No se pudo cargar el candy bar');
    }
  }

  nombreCategoria(id: number): string {
    return this.categorias().find((c) => c.id === id)?.nombre ?? '';
  }

  async agregarCategoria() {
    const nombre = this.nuevaCategoria.value.trim();
    if (!nombre) return;
    try {
      await this.candy.crearCategoria(nombre);
      this.nuevaCategoria.reset();
      this.categorias.set(await this.candy.getCategorias());
    } catch {
      this.error.set('Esa categoría ya existe');
    }
  }

  abrir(p: Product | null) {
    this.error.set('');
    this.editando.set(p);
    if (p) {
      this.form.reset({ ...p, descripcion: p.descripcion ?? '', imagen_url: p.imagen_url ?? '' });
    } else {
      // si está filtrando por una categoría, el producto nuevo arranca en esa
      this.form.reset({ category_id: this.categoriaFiltro() ?? 0 });
    }
  }

  async guardar() {
    if (this.form.invalid) return this.form.markAllAsTouched();

    this.guardando.set(true);
    this.error.set('');
    try {
      const datos = this.form.getRawValue();
      await this.candy.guardarProducto(
        { ...datos, precio: Number(datos.precio), descripcion: datos.descripcion || null, imagen_url: datos.imagen_url || null },
        this.editando()?.id,
      );
      this.editando.set(undefined);
      this.productos.set(await this.candy.getProductos(false));
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo guardar el producto');
    } finally {
      this.guardando.set(false);
    }
  }

  async toggleActivo(p: Product) {
    try {
      await this.candy.guardarProducto({ ...p, activo: !p.activo }, p.id);
      this.productos.update((lista) => lista.map((x) => (x.id === p.id ? { ...x, activo: !p.activo } : x)));
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo cambiar el estado');
    }
  }
}
