import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Notificacion } from '../models/notificacion';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  readonly lista = signal<Notificacion[]>([]);
  readonly sinLeer = computed(() => this.lista().filter((n) => !n.leida).length);

  // Permiso del navegador para mostrar avisos del sistema operativo
  readonly permiso = signal<NotificationPermission>('Notification' in window ? Notification.permission : 'denied');

  // computed con el id: el effect solo se dispara si cambia el usuario (no en cada refresh del token)
  private userId = computed(() => this.auth.session()?.user.id ?? null);
  private canal: RealtimeChannel | null = null;

  constructor() {
    effect(() => {
      const id = this.userId();
      untracked(() => this.conectar(id));
    });
  }

  private async conectar(userId: string | null) {
    if (this.canal) {
      await this.supabase.removeChannel(this.canal);
      this.canal = null;
    }
    if (!userId) {
      this.lista.set([]);
      return;
    }

    const { data } = await this.supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    this.lista.set(data ?? []);

    // Cada notificación nueva llega sola, sin recargar
    this.canal = this.supabase
      .channel(`notificaciones-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as Notificacion;
          this.lista.update((l) => [n, ...l]);
          this.mostrarAviso(n);
        },
      )
      .subscribe();
  }

  async pedirPermiso() {
    if (!('Notification' in window)) return;
    this.permiso.set(await Notification.requestPermission());
  }

  /** Aviso del sistema operativo. Con la PWA instalada lo muestra el service worker. */
  private async mostrarAviso(n: Notificacion) {
    if (this.permiso() !== 'granted') return;

    const opciones = {
      body: n.mensaje,
      icon: 'icons/icon-192x192.png',
      // Así el service worker de Angular abre la app en esa ruta al tocar el aviso
      data: { onActionClick: { default: { operation: 'navigateLastFocusedOrOpen', url: n.link ?? '/' } } },
    };

    const registro = await navigator.serviceWorker?.getRegistration();
    if (registro) {
      registro.showNotification(n.titulo, opciones);
    } else {
      new Notification(n.titulo, opciones);
    }
  }

  async marcarLeida(id: number) {
    this.lista.update((l) => l.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    await this.supabase.from('notifications').update({ leida: true }).eq('id', id);
  }

  async marcarTodas() {
    const ids = this.lista().filter((n) => !n.leida).map((n) => n.id);
    if (!ids.length) return;
    this.lista.update((l) => l.map((n) => ({ ...n, leida: true })));
    await this.supabase.from('notifications').update({ leida: true }).in('id', ids);
  }
}
