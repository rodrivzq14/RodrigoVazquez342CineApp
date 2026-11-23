import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SeatService } from './seat.service';
import { ItemCompra, MiCompra, OrderDetail, Quote } from '../models/order';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private supabase = inject(SupabaseService).client;
  private seatService = inject(SeatService);

  async quote(screeningId: number, items: ItemCompra[] = [], usarCredito = false): Promise<Quote> {
    const { data, error } = await this.supabase.rpc('quote_purchase', {
      p_screening: screeningId,
      p_token: this.seatService.token,
      p_items: items,
      p_usar_credito: usarCredito,
    });
    if (error) throw error;
    return data as Quote;
  }

  async purchase(
    screeningId: number,
    items: ItemCompra[] = [],
    usarCredito = false,
  ): Promise<{ order_id: number; access_token: string }> {
    const { data, error } = await this.supabase.rpc('purchase_tickets', {
      p_screening: screeningId,
      p_token: this.seatService.token,
      p_items: items,
      p_usar_credito: usarCredito,
    });
    if (error) throw error;
    return data;
  }

  async getOrder(orderId: number, accessToken: string): Promise<OrderDetail> {
    const { data, error } = await this.supabase.rpc('get_order', {
      p_order: orderId,
      p_access: accessToken,
    });
    if (error) throw error;
    return data as OrderDetail;
  }

  async misCompras(): Promise<MiCompra[]> {
    const { data, error } = await this.supabase.rpc('mis_compras');
    if (error) throw error;
    return (data ?? []) as MiCompra[];
  }

  /** Devuelve cuánto crédito se acreditó */
  async cancelar(orderId: number): Promise<number> {
    const { data, error } = await this.supabase.rpc('cancelar_compra', { p_order: orderId });
    if (error) throw error;
    return Number(data);
  }
}
