import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

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
}
