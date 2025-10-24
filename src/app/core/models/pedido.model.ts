// Tipos válidos de estado de pedido (según tu backend)
export type EstadoPedido =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'PREPARACION'
  | 'ENTREGADO'
  | 'CANCELADO';

// Modelo del Pedido (cabecera)
export interface Pedido {
  pedido_id: number;              // INT IDENTITY(1,1)
  cliente_id: number;             // INT NOT NULL DEFAULT 1
  usuario_id: number | null;      // INT NULL
  fecha_pedido?: string;          // DATETIME DEFAULT GETDATE()
  hora_pedido?: string;           // TIME DEFAULT CAST(GETDATE() AS TIME)
  estado_pedido?: EstadoPedido;  // 🔹 opcional ahora
  subtotal: number;               // DECIMAL(12,2) NULL
  monto_descuento: number;        // DECIMAL(12,2) DEFAULT 0
  total: number;                  // DECIMAL(12,2) NULL
  notas_generales: string | null; // TEXT NULL
  fecha_registro?: string;        // DATETIME DEFAULT GETDATE()
}
