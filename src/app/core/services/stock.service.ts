// src/app/dashboard/services/stock.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stock, StockMovimiento } from '../models/stock.model';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = 'http://localhost:3000/api/v2'; // base de la API

  constructor(private http: HttpClient) {}

  // ===========================================
  // 🟩 STOCK PRINCIPAL
  // ===========================================

  // 📘 Obtener todos los registros de stock
  getStocks(): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.apiUrl}/stock`);
  }

  // 📗 Obtener un registro de stock por ID
  getStockById(id: number): Observable<Stock> {
    return this.http.get<Stock>(`${this.apiUrl}/stock/${id}`);
  }

  // 📙 Crear nuevo registro de stock (entrada inicial)
  createStock(stock: Stock): Observable<any> {
    return this.http.post(`${this.apiUrl}/stock`, stock);
  }

  // 📒 Actualizar registro de stock existente
  updateStock(id: number, stock: Partial<Stock>): Observable<any> {
    return this.http.put(`${this.apiUrl}/stock/${id}`, stock);
  }

  // 📕 Eliminar registro de stock
  deleteStock(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/stock/${id}`);
  }

  // ===========================================
  // 🟨 MOVIMIENTOS DE STOCK
  // ===========================================

  // 📘 Obtener todos los movimientos
  getMovimientos(): Observable<StockMovimiento[]> {
    return this.http.get<StockMovimiento[]>(`${this.apiUrl}/stock-movimientos`);
  }

  // 📗 Obtener movimientos por ID de stock
  getMovimientosPorStock(id_stock: number): Observable<StockMovimiento[]> {
    return this.http.get<StockMovimiento[]>(`${this.apiUrl}/stock-movimientos/por-stock/${id_stock}`);
  }

  // 📙 Registrar nuevo movimiento (entrada, salida o ajuste)
  registrarMovimiento(movimiento: StockMovimiento): Observable<any> {
    return this.http.post(`${this.apiUrl}/stock-movimientos`, movimiento);
  }

  // 📒 Actualizar movimiento de stock
  updateMovimiento(id: number, movimiento: Partial<StockMovimiento>): Observable<any> {
    return this.http.put(`${this.apiUrl}/stock-movimientos/${id}`, movimiento);
  }

  // 📕 Eliminar movimiento
  deleteMovimiento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/stock-movimientos/${id}`);
  }
}