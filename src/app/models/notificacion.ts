export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  link: string | null;
  leida: boolean;
  created_at: string;
}
