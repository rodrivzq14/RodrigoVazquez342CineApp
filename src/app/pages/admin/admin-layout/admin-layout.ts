import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SiPermiso } from '../../../directives/si-permiso';
import { SiRol } from '../../../directives/si-rol';
import { SECCIONES } from './secciones';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SiPermiso, SiRol],
  selector: 'app-admin-layout',
  styleUrl: './admin-layout.css',
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  readonly secciones = SECCIONES;
}
