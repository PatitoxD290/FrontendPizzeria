// ===========================================
// DELIVERY
// ===========================================
export interface Delivery {
  ID_Delivery: number;
  ID_Pedido: number;
  Direccion: string;
  Estado_D: 'E' | 'P' | 'C';
}