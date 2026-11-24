import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Permiso, RolPersonalizado } from '../models/permisos';
import { Role } from '../models/profile';

export interface UsuarioConRol {
  id: string;
  email: string;
  nombre: string;
  role: Role;
  rol_personalizado_id: number | null;
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private supabase = inject(SupabaseService).client;

  async getRoles(): Promise<RolPersonalizado[]> {
    const { data, error } = await this.supabase.from('roles_personalizados').select('id, nombre, permisos').order('nombre');
    if (error) throw error;
    return data ?? [];
  }

  async guardar(nombre: string, permisos: Permiso[], id?: number): Promise<void> {
    const { error } = id
      ? await this.supabase.from('roles_personalizados').update({ nombre, permisos }).eq('id', id)
      : await this.supabase.from('roles_personalizados').insert({ nombre, permisos });
    if (error) throw error;
  }

  async borrar(id: number): Promise<void> {
    const { error } = await this.supabase.from('roles_personalizados').delete().eq('id', id);
    if (error) throw error;
  }

  async getUsuarios(): Promise<UsuarioConRol[]> {
    const { data, error } = await this.supabase.rpc('usuarios_con_rol');
    if (error) throw error;
    return (data ?? []) as UsuarioConRol[];
  }

  /** rolId = null le saca el rol personalizado */
  async asignar(userId: string, rolId: number | null): Promise<void> {
    const { error } = await this.supabase.rpc('asignar_rol', { p_user: userId, p_rol: rolId });
    if (error) throw error;
  }
}
