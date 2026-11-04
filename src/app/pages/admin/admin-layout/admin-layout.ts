import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-admin-layout',
  styleUrl: './admin-layout.css',
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  readonly secciones = [
    { ruta: 'funciones', nombre: 'Funciones' },
    { ruta: 'peliculas', nombre: 'Películas' },
    { ruta: 'configuracion', nombre: 'Precios y cupones' },
    { ruta: 'actividad', nombre: 'Actividad' },
  ];
}
