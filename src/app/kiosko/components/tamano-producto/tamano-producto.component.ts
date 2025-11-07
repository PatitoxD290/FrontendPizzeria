import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TamanoService } from '../../../core/services/tamano.service';
import { Tamano } from '../../../core/models/tamano.model';
import { UpperCasePipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-tamano-producto',
  templateUrl: './tamano-producto.component.html',
  styleUrls: ['./tamano-producto.component.css'],
  standalone: true,
  imports: [CommonModule, UpperCasePipe],
})
export class TamanoProductoComponent implements OnInit {
  tamanos: Tamano[] = [];
  selectedTamano: Tamano | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<TamanoProductoComponent>,
    private tamanoService: TamanoService
  ) {}

  ngOnInit(): void {
    this.cargarTamanos();
    this.selectedTamano = this.data.tamanoSeleccionado ?? null;
  }

  private cargarTamanos() {
    this.tamanoService.getTamanos().subscribe({
      next: (tamanos) => (this.tamanos = tamanos),
      error: (err) => console.error(err),
    });
  }

  calcularPrecioTotal(t: Tamano): number {
    const precioBase = this.data.producto.precio ?? this.data.producto.Precio_Base ?? 0;
    return precioBase + (t.Variacion_Precio ?? 0);
  }

  seleccionarTamano(t: Tamano) {
    this.selectedTamano = t;
    setTimeout(() => this.dialogRef.close(t), 150);
  }
}
