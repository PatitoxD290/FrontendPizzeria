// src/app/dashboard/models/cliente.model.ts
export interface Cliente {
  cliente_id?: number;        // Generado automáticamente por el backend (IDENTITY)
  nombre_completo: string;    // Obligatorio
  dni?: string | null;        // Opcional, pero si se ingresa debe ser único
  telefono?: string | null;   // Opcional (puede ser nulo en la BD)
  fecha_registro?: string;    // Generado automáticamente por el backend (GETDATE)
}
