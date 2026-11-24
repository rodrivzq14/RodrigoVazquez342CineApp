export type EstadoPropuesta = 'pendiente' | 'aceptada' | 'rechazada';

export interface Propuesta {
  id: number;
  titulo: string;
  descripcion: string;
  motivo: string;
  estado: EstadoPropuesta;
  respuesta: string | null;
  created_at: string;
}

// La versión del panel trae quién la hizo
export interface PropuestaAdmin extends Propuesta {
  autor: string;
  email: string;
}
