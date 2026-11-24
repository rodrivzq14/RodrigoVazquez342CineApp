import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Canje, Recompensa, TipoRecompensa } from '../models/canje';

@Injectable({ providedIn: 'root' })
export class CanjeService {
  private supabase = inject(SupabaseService).client;

  async getRecompensas(soloActivas = true): Promise<Recompensa[]> {
    let query = this.supabase.from('rewards').select('*').order('puntos');
    if (soloActivas) query = query.eq('activo', true);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async misCanjes(): Promise<Canje[]> {
    const { data, error } = await this.supabase
      .from('redemptions')
      .select('id, nombre, tipo, puntos, codigo, estado, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  /** Descuenta los puntos. Si es una entrada devuelve el crédito acreditado, si es producto el código para retirarlo */
  async canjear(recompensaId: number): Promise<{ tipo: TipoRecompensa; codigo: string; credito: number }> {
    const { data, error } = await this.supabase.rpc('canjear', { p_reward: recompensaId });
    if (error) throw error;
    return data;
  }

  /** Empleado del candy bar */
  async validar(codigo: string): Promise<{ nombre: string; puntos: number }> {
    const { data, error } = await this.supabase.rpc('validar_canje', { p_codigo: codigo });
    if (error) throw error;
    return data;
  }

  // ---------- Panel ----------

  async guardarRecompensa(datos: Omit<Recompensa, 'id'>, id?: number): Promise<void> {
    const { error } = id
      ? await this.supabase.from('rewards').update(datos).eq('id', id)
      : await this.supabase.from('rewards').insert(datos);
    if (error) throw error;
  }
}
