import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CarritoService } from '../../../core/services/auth/carrito.service';

@Component({
  selector: 'app-detalle-producto',
  templateUrl: './detalle-producto.component.html',
  styleUrls: ['./detalle-producto.component.css']
})
export class DetalleProductoComponent {
  cantidad: number = 0;
  tamanoSeleccionado: string = 'mediana';
  precioActual: number = 0;

  // Multiplicadores de precio según el tamaño
  private multiplicadoresPrecio: { [key: string]: number } = {
    kids: 0.6,      // 40% menos que mediana
    personal: 0.8,  // 20% menos que mediana
    mediana: 1,     // Precio base
    grande: 1.3,    // 30% más que mediana
    familiar: 1.6   // 60% más que mediana
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DetalleProductoComponent>,
    private carritoService: CarritoService
  ) {
    this.precioActual = this.data.precio;
  }

  seleccionarTamano(tamano: string) {
    this.tamanoSeleccionado = tamano;
    this.precioActual = this.data.precio * this.multiplicadoresPrecio[tamano];
  }

  incrementarCantidad() {
    this.cantidad++;
  }

  decrementarCantidad() {
    if (this.cantidad > 0) this.cantidad--;
  }

  cerrar() {
    this.dialogRef.close();
  }

  agregarCarrito() {
    if (this.cantidad <= 0) return;

    const subtotal = this.precioActual * this.cantidad;

    const producto = {
      nombre: this.data.nombre,
      precio: this.precioActual,
      cantidad: this.cantidad,
      imagen: this.data.imagen,
      subtotal: subtotal,
      tamano: this.tamanoSeleccionado
    };

    this.carritoService.agregarProducto(producto);
    this.dialogRef.close();
  }
}