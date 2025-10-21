// src/app/dashboard/models/cliente.model.ts
export interface Cliente {
  cliente_id?: number;
  nombre_completo: string;
  dni: string;
  fecha_registro?: string; // opcional porque lo genera el backend
}
