import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Coupon, CouponTipo } from '../models/coupon';

export interface Setting {
  clave: string;
  valor: number;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private supabase = inject(SupabaseService).client;

  async getPrecios(): Promise<{ normal: number; vip: number }> {
    const { data, error } = await this.supabase
      .from('settings')
      .select('clave, valor')
      .in('clave', ['precio_entrada', 'precio_vip']);
    if (error) throw error;

    const valor = (clave: string) => Number(data?.find((r) => r.clave === clave)?.valor ?? 0);
    return { normal: valor('precio_entrada'), vip: valor('precio_vip') };
  }

  async getTodas(): Promise<Setting[]> {
    const { data, error } = await this.supabase.from('settings').select('clave, valor').order('clave');
    if (error) throw error;
    return data ?? [];
  }

  async guardar(clave: string, valor: number): Promise<void> {
    const { error } = await this.supabase.from('settings').update({ valor }).eq('clave', clave);
    if (error) throw error;
  }

  // ---------- Cupones ----------

  async getCupones(): Promise<Coupon[]> {
    const { data, error } = await this.supabase.from('coupons').select('*').order('id');
    if (error) throw error;
    return data ?? [];
  }

  async guardarCupon(id: number, porcentaje: number, activo: boolean): Promise<void> {
    const { error } = await this.supabase.from('coupons').update({ porcentaje, activo }).eq('id', id);
    if (error) throw error;
  }

  async crearCupon(tipo: CouponTipo, porcentaje: number): Promise<void> {
    const { error } = await this.supabase.from('coupons').insert({ tipo, porcentaje });
    if (error) throw error;
  }
}
