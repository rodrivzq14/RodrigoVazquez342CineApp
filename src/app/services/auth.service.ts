import { Injectable, computed, inject, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models/profile';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService).client;

  readonly session = signal<Session | null>(null);
  readonly profile = signal<Profile | null>(null);

  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly role = computed(() => this.profile()?.role ?? null);

  /** Los guards esperan a esta promesa antes de decidir */
  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    this.session.set(data.session);
    if (data.session) await this.loadProfile(data.session.user.id);

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      if (session) {
        // setTimeout evita un bloqueo conocido de supabase-js
        // si se hace una llamada dentro de este callback
        setTimeout(() => this.loadProfile(session.user.id), 0);
      } else {
        this.profile.set(null);
      }
    });
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    this.profile.set(data as Profile | null);
  }

  async register(email: string, password: string, datos: Record<string, unknown>) {
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: datos }, // llega al trigger como raw_user_meta_data
    });
    if (error) throw error;
  }

  async login(email: string, password: string) {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // esperamos a tener el perfil cargado, así el rol ya está disponible
    const { data } = await this.supabase.auth.getSession();
    if (data.session) await this.loadProfile(data.session.user.id);
  }

  async logout() {
    await this.supabase.auth.signOut();
  }
}