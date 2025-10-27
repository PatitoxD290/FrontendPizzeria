// Modelo del Detalle de Pedido
export interface DetallePedido {
  detalle_pedido_id: number;       // INT IDENTITY(1,1)
  pedido_id: number;               // INT NOT NULL
  producto_id: number;             // INT NOT NULL
  tamano_id: number | null;        // INT NULL
  cantidad: number;                // INT NOT NULL CHECK (cantidad > 0)
  precio_unitario: number;         // DECIMAL(10,2) NOT NULL
  subtotal: number;                // DECIMAL(12,2) NOT NULL
  notas_producto: string | null;   // TEXT NULL

  // 👇 Campos extra (solo para mostrar en frontend)
  nombre_producto?: string;
  nombre_categoria?: string;
}
