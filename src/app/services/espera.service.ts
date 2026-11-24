import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SeatService } from './seat.service';

export interface MiEspera {
  estado: 'esperando' | 'avisado';
  posicion: number;
  vence_at: string | null; // solo si está avisado
}

export interface EsperaPerfil extends MiEspera {
  screening_id: number;
  starts_at: string;
  titulo: string;
  poster_url: string;
  sala: string;
}

/** Lista de espera de funciones agotadas (la lógica está en 08_lista_espera.sql) */
@Injectable({ providedIn: 'root' })
export class EsperaService {
  private supabase = inject(SupabaseService).client;
  private seatService = inject(SeatService);

  /** Devuelve en qué posición quedó */
  async unirse(screeningId: number): Promise<number> {
    const { data, error } = await this.supabase.rpc('unirse_espera', { p_screening: screeningId });
    if (error) throw error;
    return data as number;
  }

  async salir(screeningId: number): Promise<void> {
    const { error } = await this.supabase.rpc('salir_espera', { p_screening: screeningId });
    if (error) throw error;
  }

  async miEspera(screeningId: number): Promise<MiEspera | null> {
    const { data, error } = await this.supabase.rpc('mi_espera', { p_screening: screeningId });
    if (error) throw error;
    return data as MiEspera | null;
  }

  /** Si me guardaron una butaca, la paso a esta pestaña para poder comprarla. Devuelve cuántas. */
  async tomarReserva(screeningId: number): Promise<number> {
    const { data, error } = await this.supabase.rpc('tomar_reserva_espera', {
      p_screening: screeningId,
      p_token: this.seatService.token,
    });
    if (error) throw error;
    return data as number;
  }

  async misEsperas(): Promise<EsperaPerfil[]> {
    const { data, error } = await this.supabase.rpc('mis_esperas');
    if (error) throw error;
    return (data ?? []) as EsperaPerfil[];
  }

  /** Para el admin: { id de función -> cantidad de gente esperando } */
  async resumen(): Promise<Map<number, number>> {
    const { data, error } = await this.supabase.from('lista_espera_resumen').select('*');
    if (error) throw error;
    return new Map((data ?? []).map((r: { screening_id: number; cantidad: number }) => [r.screening_id, r.cantidad]));
  }
}
