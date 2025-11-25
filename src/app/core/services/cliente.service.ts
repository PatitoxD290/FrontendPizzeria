import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente, ClienteDTO, ClientePuntos } from '../../core/models/cliente.model'; // ⚠️ Ajusta la ruta

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'https://backend-pizza-git-175143409336.us-central1.run.app/api/v2/clientes';

  constructor(private http: HttpClient) {}

  // =========================================
  // 📘 LECTURA
  // =========================================

  // Obtener todos los clientes
  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  // Obtener un cliente por ID
  getClienteById(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  // =========================================
  // 📗 ESCRITURA (Usando DTOs)
  // =========================================

  // Crear cliente
  createCliente(cliente: ClienteDTO): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  // Actualizar cliente
  updateCliente(id: number, cliente: ClienteDTO): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, cliente);
  }

  // Eliminar cliente
  deleteCliente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // =========================================
  // 🔍 BÚSQUEDA Y EXTRAS
  // =========================================

  // Buscar cliente por DNI o RUC (Consulta externa + interna)
  buscarClientePorDocumento(doc: string): Observable<any> {
    // Retorna { message: string, cliente: Cliente }
    return this.http.get<any>(`${this.apiUrl}/buscar/${doc}`);
  }

  // 🌟 Obtener puntos de fidelidad (NUEVO)
  getPuntosCliente(id: number): Observable<ClientePuntos> {
    return this.http.get<ClientePuntos>(`${this.apiUrl}/puntos/${id}`);
  }
}