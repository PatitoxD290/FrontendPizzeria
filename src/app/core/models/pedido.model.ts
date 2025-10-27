// ===========================================
// PEDIDO
// ===========================================
export interface Pedido {
  ID_Pedido: number;
  ID_Cliente: number;
  ID_Usuario: number;
  Notas: string;
  SubTotal: number;
  Estado_P: 'P' | 'C' | 'E' | 'D';
  Fecha_Registro: string;
  Hora_Pedido: string;
}

// ===========================================
// PEDIDO DETALLE
// ===========================================
export interface PedidoDetalle {
  ID_Pedido_D: number;
  ID_Pedido: number;
  ID_Producto: number;
  ID_Tamano: number;
  Cantidad: number;
  PrecioTotal: number;

  nombre_producto: string;
  nombre_categoria: string;
}