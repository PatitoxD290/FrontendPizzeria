import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { PedidoService } from '../../../../core/services/pedido.service';
import { PedidoDetalle, PedidoConDetalle } from '../../../../core/models/pedido.model';

// 🟢 INTERFAZ PARA LO QUE REALMENTE TRAE EL BACKEND
interface PedidoDetalleBackend {
  ID_Pedido_D: number;
  ID_Pedido: number;
  ID_Producto_T?: number | null;
  ID_Combo?: number | null;
  Cantidad: number;
  PrecioTotal: number;
  nombre_producto?: string;
  nombre_tamano?: string;
  nombre_combo?: string;
  tipo: 'producto' | 'combo';
  nombre?: string;
}

// 🟢 INTERFAZ PARA LA RESPUESTA COMPLETA DEL BACKEND
interface PedidoResponse {
  detalles: PedidoDetalleBackend[];
  Notas: string;
  [key: string]: any; // Para otras propiedades del pedido
}

// 🟢 INTERFAZ EXTENDIDA CON LOS CAMPOS NORMALIZADOS
interface PedidoDetalleCompleto extends PedidoDetalle {
  precioUnitario?: number;
}

@Component({
  selector: 'app-ver-detalle-pedido',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './ver-detalle-pedido.component.html',
  styleUrls: ['./ver-detalle-pedido.component.css']
})
export class VerDetallePedidoComponent implements OnInit {
  
  detalles: PedidoDetalleCompleto[] = [];
  notas: string = '';
  loading = true;
  error = '';

  constructor(
    private pedidoService: PedidoService,
    private dialogRef: MatDialogRef<VerDetallePedidoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { pedido_id: number }
  ) {}

  ngOnInit(): void {
    this.cargarDetalles();
  }

  private cargarDetalles(): void {
    this.pedidoService.getPedidoById(this.data.pedido_id).subscribe({
      next: (res: any) => {
        // 🟢 CASTEAR LA RESPUESTA Y NORMALIZAR LOS DETALLES
        const response = res as PedidoResponse;
        
        if (response.detalles && Array.isArray(response.detalles)) {
          this.detalles = response.detalles.map((detalle: PedidoDetalleBackend) => {
            // 🟢 CREAR OBJETO NORMALIZADO QUE CUMPLA CON PedidoDetalle
            const detalleNormalizado: PedidoDetalle = {
              ID_Pedido_D: detalle.ID_Pedido_D,
              ID_Pedido: detalle.ID_Pedido,
              ID_Producto_T: detalle.ID_Producto_T,
              ID_Combo: detalle.ID_Combo,
              Cantidad: detalle.Cantidad,
              PrecioTotal: detalle.PrecioTotal,
              // 🟢 MAPEAR CAMPOS DEL BACKEND AL MODELO FRONTEND
              Nombre_Producto: detalle.nombre_producto,
              Nombre_Combo: detalle.nombre_combo,
              Nombre_Item: detalle.nombre,
              Tamano_Nombre: detalle.nombre_tamano,
              Tipo: detalle.tipo
            };

            return {
              ...detalleNormalizado,
              precioUnitario: this.calcularPrecioUnitario(detalleNormalizado)
            };
          });
        } else {
          this.detalles = [];
        }
        
        this.notas = response.Notas || '';
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar detalles:', err);
        this.error = 'No se pudieron cargar los detalles del pedido.';
        this.loading = false;
      }
    });
  }

  // 🟢 MÉTODO PARA CALCULAR PRECIO UNITARIO
  private calcularPrecioUnitario(detalle: PedidoDetalle): number {
    if (detalle.Cantidad > 0 && detalle.PrecioTotal) {
      return detalle.PrecioTotal / detalle.Cantidad;
    }
    return 0;
  }

  // 🛠️ Helpers Visuales
  getItemName(d: PedidoDetalle): string {
    return d.Nombre_Combo || d.Nombre_Producto || d.Nombre_Item || 'Producto';
  }

  getItemDetail(d: PedidoDetalle): string {
    if (d.ID_Combo) return 'Combo';
    return d.Tamano_Nombre || 'Tamaño único';
  }

  isCombo(d: PedidoDetalle): boolean {
    return !!d.ID_Combo;
  }

  // 🟢 OBTENER PRECIO UNITARIO SEGURO
  getPrecioUnitario(d: PedidoDetalleCompleto): number {
    return d.precioUnitario || this.calcularPrecioUnitario(d);
  }

  // 🟢 OBTENER PRECIO TOTAL SEGURO
  getPrecioTotal(d: PedidoDetalle): number {
    return d.PrecioTotal || 0;
  }

  getTotal(): number {
    return this.detalles.reduce((acc, d) => acc + this.getPrecioTotal(d), 0);
  }

  close(): void {
    this.dialogRef.close();
  }
}