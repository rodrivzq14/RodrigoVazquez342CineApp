import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { FuncionAdmin, NuevasFunciones, ResultadoCarga, Room, Screening, ScreeningDetail } from '../models/screening';

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

  // ---------- Admin ----------

  async getProximas(): Promise<FuncionAdmin[]> {
    const { data, error } = await this.supabase
      .from('screenings')
      .select('id, starts_at, formato, idioma, rooms(nombre), movies(titulo)')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
      .limit(300);

    if (error) throw error;

    return (data ?? []).map((s: any) => ({
      id: s.id,
      starts_at: s.starts_at,
      formato: s.formato,
      idioma: s.idioma,
      titulo: s.movies?.titulo ?? '',
      sala: s.rooms?.nombre ?? '',
    }));
  }

  async getSalas(): Promise<Room[]> {
    const { data, error } = await this.supabase.from('rooms').select('id, nombre').order('id');
    if (error) throw error;
    return data ?? [];
  }

  /**
   * Guarda la programación en schedules y después generate_screenings crea cada función.
   * La sala la elige la base: prueba sala por sala hasta que el EXCLUDE de screenings no se queje.
   */
  async crearFunciones(f: NuevasFunciones): Promise<ResultadoCarga> {
    const { data: horario, error } = await this.supabase
      .from('schedules')
      .insert(f)
      .select('id')
      .single();
    if (error) throw error;

    const res = await this.supabase.rpc('generate_screenings', { p_schedule: horario.id });
    if (res.error) throw res.error;
    return res.data as ResultadoCarga;
  }

  async eliminar(id: number): Promise<void> {
    const { error } = await this.supabase.from('screenings').delete().eq('id', id);
    if (error) throw error;
  }
}
