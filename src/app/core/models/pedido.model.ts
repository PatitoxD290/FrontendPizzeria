// ===========================================
// PEDIDO
// ===========================================
export interface Pedido {
  id_pedido: number;
  id_cliente: number;
  id_usuario: number;
  notas: string;
  sub_total: number;
  estado_p: 'P' | 'C' | 'E' | 'D';
  fecha_registro: string;
  hora_pedido: string;
}

// ===========================================
// PEDIDO DETALLE
// ===========================================
export interface PedidoDetalle {
  id_pedido_d: number;
  id_pedido: number;
  id_producto: number;
  id_tamano: number;
  cantidad: number;
  precio_total: number;

  nombre_producto: string;
  nombre_categoria: string;
}