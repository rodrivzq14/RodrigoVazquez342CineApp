export interface Category {
  id: number;
  nombre: string;
}

export interface Product {
  id: number;
  category_id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen_url: string | null;
  activo: boolean;
}

export type ProductInput = Omit<Product, 'id'>;

export interface ComboItem {
  product_id: number;
  cantidad: number;
  nombre: string;
}

// Un combo siempre trae 1 entrada general + estos productos
export interface Combo {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen_url: string | null;
  activo: boolean;
  items: ComboItem[];
}

export type ComboInput = Omit<Combo, 'id' | 'items'>;
