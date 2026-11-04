import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SeatMapItem } from '../models/seat';

@Injectable({ providedIn: 'root' })
export class SeatService {
  private supabase = inject(SupabaseService).client;

  /** Identifica a esta pestaña para reservar butacas sin necesidad de login */
  readonly token = this.obtenerToken();

  private obtenerToken(): string {
    const clave = 'cine_token';
    let token = sessionStorage.getItem(clave);
    if (!token) {
      token = crypto.randomUUID();
      sessionStorage.setItem(clave, token);
    }
    return token;
  }

  async getSeatMap(screeningId: number): Promise<SeatMapItem[]> {
    const { data, error } = await this.supabase.rpc('get_seat_map', {
      p_screening: screeningId,
      p_token: this.token,
    });
    if (error) throw error;
    return (data ?? []) as SeatMapItem[];
  }

  async hold(screeningId: number, seatId: number): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('hold_seat', {
      p_screening: screeningId,
      p_seat: seatId,
      p_token: this.token,
    });
    if (error) throw error;
    return data as boolean;
  }

  async release(screeningId: number, seatId: number): Promise<void> {
    const { error } = await this.supabase.rpc('release_seat', {
      p_screening: screeningId,
      p_seat: seatId,
      p_token: this.token,
    });
    if (error) throw error;
  }

  /** Avisa cada vez que cambia una reserva. Devuelve la función para dejar de escuchar. */
  watch(onChange: () => void): () => void {
    const canal = this.supabase
      .channel(`holds-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_holds' }, () => onChange())
      .subscribe();

    return () => { this.supabase.removeChannel(canal); };
  }
}