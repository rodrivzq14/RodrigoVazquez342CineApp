import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SiPermiso } from '../../directives/si-permiso';
import { Notificaciones } from '../notificaciones/notificaciones';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, SiPermiso, Notificaciones],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  readonly auth = inject(AuthService);
  private router = inject(Router);

  async salir() {
    await this.auth.logout();
    this.router.navigate(['/']);
  }
}