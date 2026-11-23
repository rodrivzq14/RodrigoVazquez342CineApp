export interface Review {
  id: number;
  estrellas: number;
  comentario: string | null;
  created_at: string;
  autor: string; // "Juan P."
  es_mia: boolean;
  la_vio: boolean; // compró entradas para esta película
}

export interface Rating {
  movie_id: number;
  promedio: number;
  cantidad: number;
}
