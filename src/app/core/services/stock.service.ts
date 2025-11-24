import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// ⚠️ Ajusta la ruta a tus modelos
import { 
  Stock, 
  StockDTO, 
  StockMovimiento, 
  StockMovimientoDTO, 
  AlertaVencimiento 
} from '../../core/models/stock.model';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  // Endpoints base
  private apiUrlStock = 'http://localhost:3000/api/v2/stock';
  private apiUrlMovimientos = 'http://localhost:3000/api/v2/stock/movimientos';
  private apiUrlAlertas = 'http://localhost:3000/api/v2/stock/alertas'; 

  constructor(private http: HttpClient) {}

  // ===========================================
  // 🟩 STOCK PRINCIPAL (Inventario)
  // ===========================================

  getStocks(): Observable<Stock[]> {
    return this.http.get<Stock[]>(this.apiUrlStock);
  }

  getStockById(id: number): Observable<Stock> {
    return this.http.get<Stock>(`${this.apiUrlStock}/${id}`);
  }

  createStock(stock: StockDTO): Observable<any> {
    return this.http.post(this.apiUrlStock, stock);
  }

  updateStock(id: number, stock: Partial<StockDTO>): Observable<any> {
    return this.http.put(`${this.apiUrlStock}/${id}`, stock);
  }

  // ===========================================
  // 🟨 MOVIMIENTOS (Kardex)
  // ===========================================

  getMovimientos(): Observable<StockMovimiento[]> {
    return this.http.get<StockMovimiento[]>(this.apiUrlMovimientos);
  }

  // 🆕 Obtener movimientos filtrados por ID de Stock (Lote)
  getMovimientosByStock(idStock: number): Observable<StockMovimiento[]> {
    // Si tu backend tuviera un endpoint específico sería mejor, 
    // pero aquí filtramos la lista completa para asegurar compatibilidad inmediata.
    return this.getMovimientos().pipe(
      map(movimientos => movimientos.filter(m => m.ID_Stock === idStock))
    );
  }

  getMovimientoById(id: number): Observable<StockMovimiento> {
    return this.http.get<StockMovimiento>(`${this.apiUrlMovimientos}/${id}`);
  }

  registrarMovimiento(movimiento: StockMovimientoDTO): Observable<any> {
    const payload = {
      ...movimiento,
      Motivo: movimiento.Motivo?.trim() || null
    };
    return this.http.post(this.apiUrlMovimientos, payload);
  }

  updateMovimiento(id: number, movimiento: Partial<StockMovimientoDTO>): Observable<any> {
    const payload = {
      ...movimiento,
      Motivo: movimiento.Motivo?.trim() || null
    };
    return this.http.put(`${this.apiUrlMovimientos}/${id}`, payload);
  }

  // ===========================================
  // 🟦 STOCK POR INSUMO
  // ===========================================

  getStockByInsumoId(idInsumo: number): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.apiUrlStock}/insumo/${idInsumo}`);
  }

  // ===========================================
  // 🔔 ALERTAS
  // ===========================================

  getAlertasVencimiento(): Observable<AlertaVencimiento[]> {
    return this.http.get<AlertaVencimiento[]>(this.apiUrlAlertas);
  }
}