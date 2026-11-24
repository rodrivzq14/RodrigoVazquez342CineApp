export interface Genre {
  id: number;
  nombre: string;
}

export interface Movie {
  id: number;
  titulo: string;
  sinopsis: string;
  duracion_min: number;
  poster_url: string;
  edad_minima: number;
  fecha_estreno: string | null;
  precio_preventa: number | null; // si tiene, la venta abre 7 días antes del estreno a este precio
  activa: boolean;
  generos: Genre[];
}

// Lo que se manda al insertar/editar (sin id ni géneros)
export type MovieInput = Omit<Movie, 'id' | 'generos'>;
