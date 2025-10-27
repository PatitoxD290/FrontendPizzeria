// ===========================================
// VENTAS
// ===========================================
export interface Venta {
  id_venta: number;
  id_pedido: number;
  tipo_venta: 'B' | 'F' | 'N'; // Boleta | Factura | Nota
  metodo_pago: 'E' | 'T' | 'B'; // Efectivo | Tarjeta | Banco
  lugar_emision: 'A' | 'B'; // A: Almacén | B: Bar (por ejemplo)
  igv: number;
  total: number;

  nombre_cliente: string;
  productos: VentaProducto[]; 
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
