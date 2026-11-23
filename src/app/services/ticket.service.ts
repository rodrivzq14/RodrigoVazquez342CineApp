import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SeatTipo } from '../models/seat';

export interface EntradaValidada {
  titulo: string;
  sala: string;
  starts_at: string;
  edad_minima: number;
  tipo: SeatTipo;
}

export interface CandyEntregado {
  orden: number;
  titulo: string;
  starts_at: string;
  items: { nombre: string; cantidad: number; detalle: string | null }[];
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private supabase = inject(SupabaseService).client;

  /** Marca la entrada como usada. Si ya se usó o no existe, la base tira error con el motivo. */
  async validar(codigo: string): Promise<EntradaValidada> {
    const { data, error } = await this.supabase.rpc('validar_entrada', { p_codigo: codigo });
    if (error) throw error;
    return data as EntradaValidada;
  }

  /** Marca el candy de la compra como entregado (con cualquier QR de esa compra) */
  async entregarCandy(codigo: string): Promise<CandyEntregado> {
    const { data, error } = await this.supabase.rpc('validar_candy', { p_codigo: codigo });
    if (error) throw error;
    return data as CandyEntregado;
  }
}
