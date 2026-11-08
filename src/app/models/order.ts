import { SeatTipo } from './seat';
import { CouponTipo } from './coupon';

export interface Quote {
  subtotal: number;
  descuento: number;
  total: number;
  porcentaje: number;
  cupon_tipo: CouponTipo | null;
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