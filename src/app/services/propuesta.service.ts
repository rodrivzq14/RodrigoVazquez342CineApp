import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Propuesta, PropuestaAdmin } from '../models/propuesta';

@Injectable({ providedIn: 'root' })
export class PropuestaService {
  private supabase = inject(SupabaseService).client;

  /** Las del usuario logueado. Hay que filtrar: al admin la policy le deja ver todas */
  async misPropuestas(): Promise<Propuesta[]> {
    const { data: sesion } = await this.supabase.auth.getUser();
    const { data, error } = await this.supabase
      .from('movie_proposals')
      .select('id, titulo, descripcion, motivo, estado, respuesta, created_at')
      .eq('user_id', sesion.user?.id ?? '')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async proponer(titulo: string, descripcion: string, motivo: string): Promise<void> {
    const { error } = await this.supabase.from('movie_proposals').insert({ titulo, descripcion, motivo });
    if (error) {
      // el índice único de la base no deja tener dos pendientes
      if (error.code === '23505') throw new Error('Ya tenés una propuesta pendiente. Esperá la respuesta para hacer otra.');
      throw error;
    }
  }

  async retirar(id: number): Promise<void> {
    const { error } = await this.supabase.from('movie_proposals').delete().eq('id', id);
    if (error) throw error;
  }

  // ---------- Panel ----------

  async todas(): Promise<PropuestaAdmin[]> {
    const { data, error } = await this.supabase.rpc('propuestas_admin');
    if (error) throw error;
    return (data ?? []) as PropuestaAdmin[];
  }

  async resolver(id: number, estado: 'aceptada' | 'rechazada', respuesta = ''): Promise<void> {
    const { error } = await this.supabase.rpc('resolver_propuesta', { p_id: id, p_estado: estado, p_respuesta: respuesta });
    if (error) throw error;
  }
}
