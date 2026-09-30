import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Genre, Movie } from '../models/movie';

@Injectable({ providedIn: 'root' })
export class MovieService {
  private supabase = inject(SupabaseService).client;

  async getMovies(): Promise<Movie[]> {
    const { data, error } = await this.supabase
      .from('movies')
      .select('*, movie_genres(genres(id, nombre))')
      .eq('activa', true)
      .order('titulo');

    if (error) throw error;

    // Aplanamos la respuesta anidada: movie_genres[].genres -> generos[]
    return (data ?? []).map((m: any) => ({
      ...m,
      generos: m.movie_genres.map((mg: any) => mg.genres),
    }));
  }

  async getGenres(): Promise<Genre[]> {
    const { data, error } = await this.supabase.from('genres').select('*').order('nombre');
    if (error) throw error;
    return data ?? [];
  }

  async getMovie(id: number): Promise<Movie | null> {
  const { data, error } = await this.supabase
    .from('movies')
    .select('*, movie_genres(genres(id, nombre))')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return { ...data, generos: data.movie_genres.map((mg: any) => mg.genres) } as Movie;
}
}