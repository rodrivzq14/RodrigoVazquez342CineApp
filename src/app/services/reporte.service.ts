import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface FilaFacturacion {
  dia: string; // yyyy-mm-dd
  compras: number;
  entradas: number;
  facturacion: number;
  credito_usado: number;
}

export interface FilaMasVistas {
  periodo: string; // primer día de la semana o del mes
  titulo: string;
  entradas: number;
}

export interface FilaCandy {
  producto: string;
  unidades: number;
}

/** Los cálculos están en la base (12_reportes_salas.sql), acá solo se piden */
@Injectable({ providedIn: 'root' })
export class ReporteService {
  private supabase = inject(SupabaseService).client;

  async facturacion(desde: string, hasta: string): Promise<FilaFacturacion[]> {
    const { data, error } = await this.supabase.rpc('reporte_facturacion', { p_desde: desde, p_hasta: hasta });
    if (error) throw error;
    // numeric llega como string desde la base
    return (data ?? []).map((f: any) => ({
      ...f,
      compras: Number(f.compras),
      entradas: Number(f.entradas),
      facturacion: Number(f.facturacion),
      credito_usado: Number(f.credito_usado),
    }));
  }

  async masVistas(agrupar: 'week' | 'month', desde: string, hasta: string): Promise<FilaMasVistas[]> {
    const { data, error } = await this.supabase.rpc('reporte_mas_vistas', { p_agrupar: agrupar, p_desde: desde, p_hasta: hasta });
    if (error) throw error;
    return (data ?? []).map((f: any) => ({ ...f, entradas: Number(f.entradas) }));
  }

  async candy(desde: string, hasta: string): Promise<FilaCandy[]> {
    const { data, error } = await this.supabase.rpc('reporte_candy', { p_desde: desde, p_hasta: hasta });
    if (error) throw error;
    return (data ?? []).map((f: any) => ({ ...f, unidades: Number(f.unidades) }));
  }
}
