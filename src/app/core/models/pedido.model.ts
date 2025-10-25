export type EstadoPedido = 'PENDIENTE' | 'CONFIRMADO' | 'PREPARACION' | 'ENTREGADO' | 'CANCELADO';

export interface Pedido {
  pedido_id: number;
  cliente_id: number;
  usuario_id?: number | null;
  fecha_pedido: string;
  hora_pedido: string;
  estado_pedido: EstadoPedido;
  subtotal: number | null;
  monto_descuento: number;
  total: number | null;
  notas_generales: string | null;
  fecha_registro: string;
}
