// ===========================================
// VENTAS
// ===========================================
export interface Venta {
  id_venta: number;
  id_pedido: number;
  Tipo_venta: 'B' | 'F' | 'N'; // Boleta | Factura | Nota
  Metodo_pago: 'E' | 'T' | 'B'; // Efectivo | Tarjeta | Banco
  Lugar_emision: 'A' | 'B'; // A: Almacén | B: Bar (por ejemplo)
  IGV: number;
  Total: number;

  Nombre_cliente: string;
  Productos: VentaProducto[];
  Fecha_Registro: string; 
}

// ===========================================
// PRODUCTO EN VENTA
// ===========================================
export interface VentaProducto {
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}
