import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

/** "Avisame cuando haya entradas" de las películas que se estrenan pronto */
@Injectable({ providedIn: 'root' })
export class AlertaService {
  private supabase = inject(SupabaseService).client;

  /** Ids de las películas en las que el usuario pidió alerta (la policy solo devuelve las propias) */
  async misAlertas(): Promise<Set<number>> {
    const { data, error } = await this.supabase.from('movie_alerts').select('movie_id');
    if (error) throw error;
    return new Set((data ?? []).map((a: { movie_id: number }) => a.movie_id));
  }

  async activar(movieId: number): Promise<void> {
    const { error } = await this.supabase.from('movie_alerts').insert({ movie_id: movieId });
    if (error && error.code !== '23505') throw error; // si ya la tenía, no pasa nada
  }

  async desactivar(movieId: number): Promise<void> {
    const { error } = await this.supabase.from('movie_alerts').delete().eq('movie_id', movieId);
    if (error) throw error;
  }
}
