import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Screening, ScreeningDetail } from '../models/screening';

@Injectable({ providedIn: 'root' })
export class ScreeningService {
  private supabase = inject(SupabaseService).client;

  async getUpcoming(movieId: number): Promise<Screening[]> {
    const { data, error } = await this.supabase
      .from('screenings')
      .select('id, movie_id, room_id, starts_at, ends_at, formato, idioma, rooms(nombre)')
      .eq('movie_id', movieId)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at');

    if (error) throw error;

    return (data ?? []).map((s: any) => ({ ...s, sala: s.rooms?.nombre ?? '' }));
  }

  async getScreening(id: number): Promise<ScreeningDetail | null> {
  const { data, error } = await this.supabase
    .from('screenings')
    .select('id, starts_at, formato, idioma, rooms(nombre), movies(id, titulo, edad_minima)')
    .eq('id', id)
    .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const d = data as any;
    return {
      id: d.id,
      starts_at: d.starts_at,
      formato: d.formato,
      idioma: d.idioma,
      sala: d.rooms?.nombre ?? '',
      movie_id: d.movies.id,
      titulo: d.movies.titulo,
      edad_minima: d.movies.edad_minima,
    };
  }
}
