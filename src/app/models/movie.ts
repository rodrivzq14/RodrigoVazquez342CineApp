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
  activa: boolean;
  generos: Genre[];
}