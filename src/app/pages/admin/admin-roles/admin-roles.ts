import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesService, UsuarioConRol } from '../../../services/roles.service';
import { PERMISOS, Permiso, RolPersonalizado } from '../../../models/permisos';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-admin-roles',
  styleUrl: './admin-roles.css',
  templateUrl: './admin-roles.html',
})
export class AdminRoles {
  private rolesService = inject(RolesService);
  private fb = inject(FormBuilder).nonNullable;

  readonly permisos = PERMISOS;

  readonly roles = signal<RolPersonalizado[]>([]);
  readonly usuarios = signal<UsuarioConRol[]>([]);
  readonly buscar = signal('');
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly guardando = signal(false);

  // undefined = form cerrado, null = rol nuevo
  readonly editando = signal<RolPersonalizado | null | undefined>(undefined);
  readonly elegidos = signal<Set<Permiso>>(new Set());

  form = this.fb.group({ nombre: ['', [Validators.required, Validators.maxLength(40)]] });

  // Los admin no aparecen: ya pueden todo y no tiene sentido darles un rol
  readonly usuariosFiltrados = computed(() => {
    const t = this.buscar().trim().toLowerCase();
    return this.usuarios()
      .filter((u) => u.role !== 'admin')
      .filter((u) => !t || u.email.toLowerCase().includes(t) || u.nombre.toLowerCase().includes(t));
  });

  constructor() {
    this.cargar();
  }

  private async cargar() {
    try {
      const [roles, usuarios] = await Promise.all([this.rolesService.getRoles(), this.rolesService.getUsuarios()]);
      this.roles.set(roles);
      this.usuarios.set(usuarios);
    } catch {
      this.error.set('No se pudieron cargar los roles');
    }
  }

  nombrePermiso(p: Permiso): string {
    return this.permisos.find((x) => x.valor === p)?.nombre ?? p;
  }

  abrir(rol: RolPersonalizado | null) {
    this.error.set('');
    this.editando.set(rol);
    this.form.reset({ nombre: rol?.nombre ?? '' });
    this.elegidos.set(new Set(rol?.permisos ?? []));
  }

  togglePermiso(p: Permiso) {
    const nuevo = new Set(this.elegidos());
    nuevo.has(p) ? nuevo.delete(p) : nuevo.add(p);
    this.elegidos.set(nuevo);
  }

  async guardar() {
    if (this.form.invalid) return this.form.markAllAsTouched();
    if (this.elegidos().size === 0) {
      this.error.set('Elegí al menos una sección');
      return;
    }

    this.guardando.set(true);
    this.error.set('');
    try {
      await this.rolesService.guardar(this.form.controls.nombre.value.trim(), [...this.elegidos()], this.editando()?.id);
      this.editando.set(undefined);
      this.roles.set(await this.rolesService.getRoles());
    } catch (e: any) {
      this.error.set(e.message?.includes('duplicate') ? 'Ya existe un rol con ese nombre' : (e.message ?? 'No se pudo guardar'));
    } finally {
      this.guardando.set(false);
    }
  }

  async borrar(rol: RolPersonalizado) {
    const cuantos = this.usuarios().filter((u) => u.rol_personalizado_id === rol.id).length;
    const aviso = cuantos ? `\n\n${cuantos} usuario(s) lo tienen asignado y se van a quedar sin él.` : '';
    if (!confirm(`¿Borrar el rol "${rol.nombre}"?${aviso}`)) return;

    try {
      await this.rolesService.borrar(rol.id);
      await this.cargar();
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo borrar');
    }
  }

  async asignar(u: UsuarioConRol, valor: string) {
    const rolId = valor ? Number(valor) : null;
    this.mensaje.set('');
    this.error.set('');
    try {
      await this.rolesService.asignar(u.id, rolId);
      this.usuarios.update((lista) => lista.map((x) => (x.id === u.id ? { ...x, rol_personalizado_id: rolId } : x)));
      const rol = this.roles().find((r) => r.id === rolId);
      this.mensaje.set(rol ? `${u.email} ahora tiene el rol "${rol.nombre}"` : `${u.email} ya no tiene rol personalizado`);
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo asignar el rol');
    }
  }
}
