// Secciones del panel que se pueden habilitar con un rol personalizado.
// Los nombres tienen que coincidir con los del check de roles_personalizados (09_roles.sql).
export type Permiso =
  | 'funciones'
  | 'peliculas'
  | 'candy'
  | 'configuracion'
  | 'actividad'
  | 'reportes'
  | 'salas'
  | 'propuestas'
  | 'validar';

export const PERMISOS: { valor: Permiso; nombre: string }[] = [
  { valor: 'funciones', nombre: 'Funciones' },
  { valor: 'peliculas', nombre: 'Películas' },
  { valor: 'candy', nombre: 'Candy y combos' },
  { valor: 'configuracion', nombre: 'Precios y cupones' },
  { valor: 'actividad', nombre: 'Log de actividad' },
  { valor: 'reportes', nombre: 'Reportes' },
  { valor: 'salas', nombre: 'Salas' },
  { valor: 'propuestas', nombre: 'Propuestas de películas' },
  { valor: 'validar', nombre: 'Validar QR' },
];

export interface RolPersonalizado {
  id: number;
  nombre: string;
  permisos: Permiso[];
}
