export interface Usuario {
  usuario_id: number;
  dni: string;
  password?: string; // opcional, no se mostrará al listar
  nombre_completo: string;
  rol: string; // ADMIN o EMPLEADO
  estado: string; // 'A' (activo) o 'I' (inactivo)
  fecha_registro: string;
}
