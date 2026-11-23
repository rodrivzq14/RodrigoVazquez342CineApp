import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Rating, Review } from '../models/review';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private supabase = inject(SupabaseService).client;

  async getResenas(movieId: number): Promise<Review[]> {
    const { data, error } = await this.supabase.rpc('get_resenas', { p_movie: movieId });
    if (error) throw error;
    return (data ?? []) as Review[];
  }

  async getRating(movieId: number): Promise<Rating | null> {
    const { data, error } = await this.supabase.from('movie_ratings').select('*').eq('movie_id', movieId).maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Promedios de todas las películas, para mostrarlos en la cartelera */
  async getRatings(): Promise<Map<number, Rating>> {
    const { data, error } = await this.supabase.from('movie_ratings').select('*');
    if (error) throw error;
    return new Map((data ?? []).map((r: Rating) => [r.movie_id, r]));
  }

  /** Crea la reseña o, si ya tenía una para esa película, la reemplaza */
  async guardar(movieId: number, estrellas: number, comentario: string): Promise<void> {
    const { error } = await this.supabase
      .from('reviews')
      .upsert({ movie_id: movieId, estrellas, comentario: comentario || null }, { onConflict: 'movie_id,user_id' });
    if (error) throw error;
  }

  async borrar(id: number): Promise<void> {
    const { error } = await this.supabase.from('reviews').delete().eq('id', id);
    if (error) throw error;
  }
}
