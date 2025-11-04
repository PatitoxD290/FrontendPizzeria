// ===========================================
// VENTA (para leer datos)
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
// PRODUCTO EN VENTA (para leer datos)
// ===========================================
export interface VentaProducto {
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}


// ===========================================
// VENTA CREACION DTO (para escribir datos)
// 🟢 ESTE ES EL TIPO QUE USAMOS PARA CREAR VENTAS
// ===========================================
export type VentaCreacionDTO = {
  ID_Pedido: number;
  Tipo_Venta: 'B' | 'F' | 'N';
  Metodo_Pago: 'E' | 'T' | 'B';
  Lugar_Emision: 'A' | 'B';
  IGV_Porcentaje: number; // El backend espera el porcentaje
};
