import { SeatTipo } from './seat';
import { CouponTipo } from './coupon';

// Lo que el cliente elige del candy y se manda al presupuesto / compra
export interface ItemCompra {
  tipo: 'producto' | 'combo';
  id: number;
  cantidad: number;
}

export interface QuoteItem extends ItemCompra {
  nombre: string;
  precio_unitario: number;
}

export interface Quote {
  subtotal: number; // todas las entradas a precio de lista
  entradas_en_combos: number;
  descuento_combos: number;
  combos_total: number;
  productos_total: number;
  descuento: number;
  total: number;
  porcentaje: number;
  cupon_tipo: CouponTipo | null;
  credito_disponible: number;
  credito_usado: number;
  items: QuoteItem[];
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

export interface OrderItem {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  detalle: string | null; // solo en combos: qué trae
}

export interface OrderDetail {
  order_id: number;
  subtotal: number;
  descuento: number;
  credito_usado: number;
  total: number;
  puntos: number;
  estado: 'pagada' | 'cancelada';
  candy_entregado_at: string | null;
  funcion: {
    titulo: string;
    starts_at: string;
    formato: string;
    idioma: string;
    sala: string;
    edad_minima: number;
  };
  entradas: OrderTicket[];
  items: OrderItem[];
}

// Una fila del historial del perfil (función mis_compras)
export interface MiCompra {
  id: number;
  access_token: string;
  created_at: string;
  total: number;
  credito_usado: number;
  estado: 'pagada' | 'cancelada';
  puntos_ganados: number;
  movie_id: number;
  titulo: string;
  poster_url: string;
  starts_at: string;
  sala: string;
  entradas: number;
  items_candy: number;
  cancelable: boolean;
  funcion_cancelada: boolean; // la canceló el cine
}
