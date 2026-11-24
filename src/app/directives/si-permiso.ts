import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Permiso } from '../models/permisos';

/**
 * Directiva estructural: muestra el elemento solo si el usuario tiene ese permiso.
 * 'panel' = tiene al menos una sección del admin.
 * Uso: <a *appSiPermiso="'reportes'" routerLink="/admin/reportes">Reportes</a>
 */
@Directive({
  selector: '[appSiPermiso]',
})
export class SiPermiso {
  private auth = inject(AuthService);
  private template = inject(TemplateRef<unknown>);
  private contenedor = inject(ViewContainerRef);

  readonly appSiPermiso = input.required<Permiso | 'panel'>();

  private visible = false;

  constructor() {
    // Se vuelve a evaluar cuando cambian los permisos (login, logout, le asignan un rol)
    effect(() => {
      const permiso = this.appSiPermiso();
      const mostrar = permiso === 'panel' ? this.auth.entraAlPanel() : this.auth.puede(permiso);

      if (mostrar && !this.visible) {
        this.contenedor.createEmbeddedView(this.template);
      } else if (!mostrar && this.visible) {
        this.contenedor.clear();
      }
      this.visible = mostrar;
    });
  }
}
