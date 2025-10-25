export interface PrecioProducto {
  precio_id: number;
  producto_id: number;
  tamano_id?: number | null;  // opcional porque puede ser null
  precio: number;
  activo: boolean;
  fecha_registro: string;
}
