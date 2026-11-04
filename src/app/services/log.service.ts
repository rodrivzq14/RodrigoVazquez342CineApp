import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { LogEntry } from '../models/log';

@Injectable({ providedIn: 'root' })
export class LogService {
  private supabase = inject(SupabaseService).client;

  async getUltimos(cantidad = 200): Promise<LogEntry[]> {
    const { data, error } = await this.supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(cantidad);
    if (error) throw error;
    return data ?? [];
  }
}
