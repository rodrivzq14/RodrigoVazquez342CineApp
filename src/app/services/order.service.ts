import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SeatService } from './seat.service';
import { OrderDetail, Quote } from '../models/order';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private supabase = inject(SupabaseService).client;
  private seatService = inject(SeatService);

  async quote(screeningId: number): Promise<Quote> {
    const { data, error } = await this.supabase.rpc('quote_purchase', {
      p_screening: screeningId,
      p_token: this.seatService.token,
    });
    if (error) throw error;
    return data as Quote;
  }

  async purchase(screeningId: number): Promise<{ order_id: number; access_token: string }> {
    const { data, error } = await this.supabase.rpc('purchase_tickets', {
      p_screening: screeningId,
      p_token: this.seatService.token,
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
}