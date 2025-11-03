import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UpperCasePipe, CommonModule } from '@angular/common';
import { CarritoService } from '../../../core/services/carrito.service';
import { TamanoService } from '../../../core/services/tamano.service';
import { Tamano } from '../../../core/models/tamano.model';

@Component({
  selector: 'app-detalle-producto',
  templateUrl: './detalle-producto.component.html',
  standalone: true,
  imports: [UpperCasePipe, CommonModule],
  styleUrls: ['./detalle-producto.component.css'],
})
export class DetalleProductoComponent implements OnInit {
  cantidad: number = 0;
  tamanoSeleccionado: Tamano | null = null;
  precioActual: number = 0;
  tamanos: Tamano[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DetalleProductoComponent>,
    private carritoService: CarritoService,
    private tamanoService: TamanoService
  ) {
    this.precioActual = this.data.precio; // Precio base del producto
  }

  ngOnInit(): void {
    this.cargarTamanos();
  }

  // 🔹 Cargar tamaños desde el backend
  private cargarTamanos(): void {
    this.tamanoService.getTamanos().subscribe({
      next: (tamanos) => {
        this.tamanos = tamanos;
        console.log('Tamaños cargados:', tamanos);
        if (tamanos.length > 0) {
          const defaultTamano =
            tamanos.find((t) => t.Tamano.toLowerCase() === 'personal') || tamanos[0];
          this.tamanoSeleccionado = defaultTamano;
          this.actualizarPrecio();
        }
      },
      error: (err) => {
        console.error('Error al cargar tamaños:', err);
      },
    });
  }

  // 🔹 Cuando se selecciona un tamaño
  seleccionarTamano(tamano: Tamano): void {
    this.tamanoSeleccionado = tamano;
    this.actualizarPrecio();
  }

  // 🔹 Calcular precio según la variación
  private actualizarPrecio(): void {
    if (!this.tamanoSeleccionado) return;
    this.precioActual = this.data.precio + this.tamanoSeleccionado.Variacion_Precio;
  }

  incrementarCantidad(): void {
    this.cantidad++;
  }

  decrementarCantidad(): void {
    if (this.cantidad > 0) this.cantidad--;
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  agregarCarrito(): void {
    if (this.cantidad <= 0 || !this.tamanoSeleccionado) return;

    const subtotal = this.precioActual * this.cantidad;

    const producto = {
      nombre: this.data.nombre,
      precio: this.precioActual,
      cantidad: this.cantidad,
      imagen: this.data.imagen,
      subtotal: subtotal,
      tamano: this.tamanoSeleccionado.Tamano,
      idTamano: this.tamanoSeleccionado.ID_Tamano,
    };

    this.carritoService.agregarProducto(producto);
    this.dialogRef.close();
  }
}
