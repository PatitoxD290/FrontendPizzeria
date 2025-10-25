// src/app/models/detalle-pedido.model.ts
export interface DetallePedido {
  detalle_pedido_id: number;
  pedido_id: number;
  producto_id: number;
  tamano_id: number | null;       // Puede ser null según la tabla
  cantidad: number;
  precio_unitario: number;        // Decimal en SQL → number en TS
  subtotal: number;
  notas_producto: string | null;  // Puede ser null según la tabla
}
