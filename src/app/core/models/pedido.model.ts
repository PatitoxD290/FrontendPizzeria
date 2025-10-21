export interface Pedido {
  pedido_id: number;
  cliente_id: number;
  usuario_id?: number | null;
  fecha_pedido: string;
  hora_pedido: string;
  estado_pedido: string;
  subtotal: number;
  monto_descuento: number;
  total: number;
  notas_generales: string;
  fecha_registro: string;
}
