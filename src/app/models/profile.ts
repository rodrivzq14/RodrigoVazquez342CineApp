export type Role = 'cliente' | 'empleado' | 'admin';

export interface Profile {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  tipo_sangre: string;
  color_ojos: string;
  dias_vacaciones: number;
  role: Role;
  puntos: number;
  credito: number;
}