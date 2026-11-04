export type SeatTipo = 'normal' | 'accesible' | 'vip';
export type SeatEstado = 'libre' | 'ocupada' | 'reservada' | 'mia';

export interface SeatMapItem {
  seat_id: number;
  fila: string;
  bloque: 'izq' | 'centro' | 'der';
  numero: number;
  tipo: SeatTipo;
  estado: SeatEstado;
}