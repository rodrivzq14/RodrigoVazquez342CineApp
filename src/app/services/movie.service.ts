import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Genre, Movie, MovieInput } from '../models/movie';

@Injectable({ providedIn: 'root' })
export class MovieService {
  private supabase = inject(SupabaseService).client;

  /** El admin pide todas (soloActivas = false), la cartelera solo las activas */
  async getMovies(soloActivas = true): Promise<Movie[]> {
    let query = this.supabase
      .from('movies')
      .select('*, movie_genres(genres(id, nombre))')
      .order('titulo');
    if (soloActivas) query = query.eq('activa', true);

    const { data, error } = await query;
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

  /** Crea (sin id) o edita (con id) una película y reemplaza sus géneros */
  async guardar(datos: MovieInput, generoIds: number[], id?: number): Promise<void> {
    let movieId = id;

    if (movieId) {
      const { error } = await this.supabase.from('movies').update(datos).eq('id', movieId);
      if (error) throw error;
    } else {
      const { data, error } = await this.supabase.from('movies').insert(datos).select('id').single();
      if (error) throw error;
      movieId = data.id;
    }

    // Más simple borrar todos y volver a insertar que calcular la diferencia
    const borrar = await this.supabase.from('movie_genres').delete().eq('movie_id', movieId);
    if (borrar.error) throw borrar.error;

    if (generoIds.length) {
      const filas = generoIds.map((genre_id) => ({ movie_id: movieId, genre_id }));
      const { error } = await this.supabase.from('movie_genres').insert(filas);
      if (error) throw error;
    }
  }

  async setActiva(id: number, activa: boolean): Promise<void> {
    const { error } = await this.supabase.from('movies').update({ activa }).eq('id', id);
    if (error) throw error;
  }
}
