import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CarritoService } from '../../core/services/carrito/carrito.service';

@Component({
  selector: 'app-detalle-producto',
  templateUrl: './detalle-producto.component.html',
  styleUrls: ['./detalle-producto.component.css']
})
export class DetalleProductoComponent {
  cantidad: number = 0; // 👈 Empieza con 1 por defecto

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DetalleProductoComponent>,
    private carritoService: CarritoService // 👈 Inyectamos el servicio
  ) {}

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

    const subtotal = this.data.precio * this.cantidad;

    const producto = {
      nombre: this.data.nombre,
      precio: this.data.precio,
      cantidad: this.cantidad,
      imagen: this.data.imagen,
      subtotal: subtotal
    };

    // ✅ Agregamos el producto al carrito
    this.carritoService.agregarProducto(producto);

    // ✅ Cerramos el modal
    this.dialogRef.close();
  }
}
