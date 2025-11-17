// src/app/dashboard/services/stock.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stock, StockMovimiento } from '../models/stock.model';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrlStock = 'http://localhost:3000/api/v2/stock';
  private apiUrlMovimientos = 'http://localhost:3000/api/v2/stock/movimientos';

  constructor(private http: HttpClient) {}

  // ===========================================
  // 🟩 STOCK PRINCIPAL
  // ===========================================

  // 📘 Obtener todos los registros de stock
  getStocks(): Observable<Stock[]> {
    return this.http.get<Stock[]>(this.apiUrlStock);
  }

  // 📗 Obtener un registro de stock por ID
  getStockById(id: number): Observable<Stock> {
    return this.http.get<Stock>(`${this.apiUrlStock}/${id}`);
  }

  // 📙 Crear nuevo registro de stock (entrada inicial)
  createStock(stock: Omit<Stock, 'ID_Stock'>): Observable<any> {
    return this.http.post(this.apiUrlStock, stock);
  }

  // 📒 Actualizar registro de stock existente
  updateStock(id: number, stock: Partial<Stock>): Observable<any> {
    return this.http.put(`${this.apiUrlStock}/${id}`, stock);
  }

  // ===========================================
  // 🟨 MOVIMIENTOS DE STOCK
  // ===========================================

  // 📘 Obtener todos los movimientos
  getMovimientos(): Observable<StockMovimiento[]> {
    return this.http.get<StockMovimiento[]>(this.apiUrlMovimientos);
  }

  // 📗 Obtener un movimiento por ID
  getMovimientoById(id: number): Observable<StockMovimiento> {
    return this.http.get<StockMovimiento>(`${this.apiUrlMovimientos}/${id}`);
  }

  // 📙 Registrar nuevo movimiento (entrada, salida o ajuste)
  registrarMovimiento(movimiento: Omit<StockMovimiento, 'ID_Stock_M' | 'Fecha_Mov' | 'Stock_ACT'>): Observable<any> {
    return this.http.post(this.apiUrlMovimientos, movimiento);
  }

  // 📒 Actualizar movimiento de stock
  updateMovimiento(id: number, movimiento: Partial<StockMovimiento>): Observable<any> {
    return this.http.put(`${this.apiUrlMovimientos}/${id}`, movimiento);
  }

  // ===========================================
  // 🟦 STOCK POR INSUMO
  // ===========================================

  // 📘 Obtener stock por ID de insumo
  getStockByInsumoId(idInsumo: number): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.apiUrlStock}/insumo/${idInsumo}`);
  }
}