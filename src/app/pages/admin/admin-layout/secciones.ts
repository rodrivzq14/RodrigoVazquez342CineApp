import { Permiso } from '../../../models/permisos';

// Menú del panel. Cada sección se muestra solo si el usuario tiene el permiso.
export const SECCIONES: { ruta: string; nombre: string; permiso: Permiso }[] = [
  { ruta: 'reportes', nombre: 'Reportes', permiso: 'reportes' },
  { ruta: 'funciones', nombre: 'Funciones', permiso: 'funciones' },
  { ruta: 'salas', nombre: 'Salas', permiso: 'salas' },
  { ruta: 'peliculas', nombre: 'Películas', permiso: 'peliculas' },
  { ruta: 'productos', nombre: 'Candy', permiso: 'candy' },
  { ruta: 'combos', nombre: 'Combos', permiso: 'candy' },
  { ruta: 'configuracion', nombre: 'Precios y cupones', permiso: 'configuracion' },
  { ruta: 'canjes', nombre: 'Canjes', permiso: 'configuracion' },
  { ruta: 'propuestas', nombre: 'Propuestas', permiso: 'propuestas' },
  { ruta: 'actividad', nombre: 'Actividad', permiso: 'actividad' },
];
