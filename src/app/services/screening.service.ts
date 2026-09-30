import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Screening } from '../models/screening';

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
}