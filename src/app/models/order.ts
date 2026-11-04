import { SeatTipo } from './seat';

export interface Quote {
  subtotal: number;
  descuento: number;
  total: number;
  porcentaje: number;
  cantidad: number;
  cantidad_vip: number;
}

export interface OrderTicket {
  id: number;
  qr_token: string;
  precio: number;
  tipo: SeatTipo;
  butaca: string;
}

export interface OrderDetail {
  order_id: number;
  subtotal: number;
  descuento: number;
  total: number;
  puntos: number;
  funcion: {
    titulo: string;
    starts_at: string;
    formato: string;
    idioma: string;
    sala: string;
    edad_minima: number;
  };
  entradas: OrderTicket[];
}