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

export interface NuevasFunciones {
  movie_id: number;
  dias: number[]; // 1 = lunes ... 7 = domingo
  hora: string; // '18:00'
  desde: string; // '2026-11-02'
  hasta: string;
  formato: string;
  idioma: string;
}

// Lo que devuelve generate_screenings: fechas yyyy-mm-dd y el id de la sala
export interface ResultadoCarga {
  creadas: { fecha: string; sala: number }[];
  sin_sala: string[];
}

export interface Room {
  id: number;
  nombre: string;
}

export interface FuncionAdmin {
  id: number;
  starts_at: string;
  formato: string;
  idioma: string;
  titulo: string;
  sala: string;
}
