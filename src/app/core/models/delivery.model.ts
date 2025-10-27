// ===========================================
// DELIVERY
// ===========================================
export interface Delivery {
  id_delivery: number;
  id_pedido: number;
  direccion: string;
  estado_d: 'E' | 'P' | 'C';
}