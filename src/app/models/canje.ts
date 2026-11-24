export type TipoRecompensa = 'entrada' | 'producto';

// Lo que se puede canjear con puntos (lo configura el admin)
export interface Recompensa {
  id: number;
  nombre: string;
  tipo: TipoRecompensa;
  product_id: number | null;
  puntos: number;
  activo: boolean;
}

// Un canje que hizo el usuario
export interface Canje {
  id: number;
  nombre: string;
  tipo: TipoRecompensa;
  puntos: number;
  codigo: string;
  estado: 'disponible' | 'usado' | 'acreditado';
  created_at: string;
}
