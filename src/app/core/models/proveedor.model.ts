// ===========================================
// PROVEEDOR
// ===========================================
export interface Proveedor {
  id_proveedor: number;
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  persona_contacto: string;
  estado: 'A' | 'I';
  fecha_registro: string;
}