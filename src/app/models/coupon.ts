export type CouponTipo = 'primera_compra' | 'mayores_50';

export interface Coupon {
  id: number;
  tipo: CouponTipo;
  porcentaje: number;
  activo: boolean;
}
