import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/profile';

/**
 * Directiva estructural: muestra el elemento solo si el usuario tiene alguno de esos roles.
 * Uso: <a *appSiRol="['admin']" routerLink="/admin">Admin</a>
 */
@Directive({
  selector: '[appSiRol]',
})
export class SiRol {
  private auth = inject(AuthService);
  private template = inject(TemplateRef<unknown>);
  private contenedor = inject(ViewContainerRef);

  readonly appSiRol = input.required<Role[]>();

  private visible = false;

  constructor() {
    // Se vuelve a ejecutar cuando cambia el rol (login / logout)
    effect(() => {
      const rol = this.auth.role();
      const mostrar = rol !== null && this.appSiRol().includes(rol);

      if (mostrar && !this.visible) {
        this.contenedor.createEmbeddedView(this.template);
      } else if (!mostrar && this.visible) {
        this.contenedor.clear();
      }
      this.visible = mostrar;
    });
  }
}
