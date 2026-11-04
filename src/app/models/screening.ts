export interface Screening {
  id: number;
  movie_id: number;
  room_id: number;
  starts_at: string;
  ends_at: string;
  formato: '2D' | '3D' | '4D' | '5D';
  idioma: 'castellano' | 'subtitulada';
  sala: string;
}

export interface ScreeningDetail {
  id: number;
  movie_id: number;
  titulo: string;
  edad_minima: number;
  starts_at: string;
  formato: string;
  idioma: string;
  sala: string;
}
