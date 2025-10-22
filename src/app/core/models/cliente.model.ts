// src/app/dashboard/models/cliente.model.ts
export interface Cliente {
  cliente_id?: number;          // Generado automáticamente por el backend (IDENTITY)
  nombre_completo: string;      // Obligatorio
  dni: string;                  // Obligatorio y único
  telefono?: string;            // Opcional (puede ser nulo en la BD)
  fecha_registro?: string;      // Generado por el backend (GETDATE)
}
