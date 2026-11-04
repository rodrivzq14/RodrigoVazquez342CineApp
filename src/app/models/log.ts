export interface LogEntry {
  id: number;
  user_id: string | null;
  usuario: string | null;
  accion: string;
  detalle: string | null;
  created_at: string;
}
