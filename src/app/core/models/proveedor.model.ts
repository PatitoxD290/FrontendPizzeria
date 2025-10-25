// src/app/dashboard/models/proveedor.model.ts
export interface Proveedor {
  proveedor_id?: number;
  nombre_proveedor: string;
  ruc: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  persona_contacto?: string;
  estado?: string;
  fecha_registro?: string;
}
