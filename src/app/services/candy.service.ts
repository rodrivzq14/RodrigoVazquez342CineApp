import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Category, Combo, ComboInput, Product, ProductInput } from '../models/product';

@Injectable({ providedIn: 'root' })
export class CandyService {
  private supabase = inject(SupabaseService).client;

  // ---------- Categorías ----------

  async getCategorias(): Promise<Category[]> {
    const { data, error } = await this.supabase.from('product_categories').select('*').order('nombre');
    if (error) throw error;
    return data ?? [];
  }

  async crearCategoria(nombre: string): Promise<void> {
    const { error } = await this.supabase.from('product_categories').insert({ nombre });
    if (error) throw error;
  }

  // ---------- Productos ----------

  async getProductos(soloActivos = true): Promise<Product[]> {
    let query = this.supabase.from('products').select('*').order('nombre');
    if (soloActivos) query = query.eq('activo', true);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async guardarProducto(datos: ProductInput, id?: number): Promise<void> {
    const { error } = id
      ? await this.supabase.from('products').update(datos).eq('id', id)
      : await this.supabase.from('products').insert(datos);
    if (error) throw error;
  }

  // ---------- Combos ----------

  async getCombos(soloActivos = true): Promise<Combo[]> {
    let query = this.supabase
      .from('combos')
      .select('*, combo_items(product_id, cantidad, products(nombre))')
      .order('precio');
    if (soloActivos) query = query.eq('activo', true);

    const { data, error } = await query;
    if (error) throw error;

    // Aplanamos combo_items[].products.nombre -> items[].nombre
    return (data ?? []).map(({ combo_items, ...c }: any) => ({
      ...c,
      items: combo_items.map((i: any) => ({ product_id: i.product_id, cantidad: i.cantidad, nombre: i.products.nombre })),
    }));
  }

  /** Igual que con las películas: guarda el combo y reemplaza todos sus productos */
  async guardarCombo(datos: ComboInput, items: { product_id: number; cantidad: number }[], id?: number): Promise<void> {
    let comboId = id;

    if (comboId) {
      const { error } = await this.supabase.from('combos').update(datos).eq('id', comboId);
      if (error) throw error;
    } else {
      const { data, error } = await this.supabase.from('combos').insert(datos).select('id').single();
      if (error) throw error;
      comboId = data.id;
    }

    const borrar = await this.supabase.from('combo_items').delete().eq('combo_id', comboId);
    if (borrar.error) throw borrar.error;

    const { error } = await this.supabase.from('combo_items').insert(items.map((i) => ({ ...i, combo_id: comboId })));
    if (error) throw error;
  }
}
