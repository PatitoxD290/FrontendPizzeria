import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UpperCasePipe, CommonModule } from '@angular/common';
import { CarritoService } from '../../../core/services/carrito.service';
import { TamanoService } from '../../../core/services/tamano.service';
import { Tamano } from '../../../core/models/tamano.model';

import { MatDialog } from '@angular/material/dialog';
import { TamanoProductoComponent } from '../tamano-producto/tamano-producto.component';

@Component({
  selector: 'app-detalle-producto',
  templateUrl: './detalle-producto.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./detalle-producto.component.css'],
})
export class DetalleProductoComponent implements OnInit {
  cantidad: number = 1;
  tamanoSeleccionado: Tamano | null = null;
  precioActual: number = 0;
  tamanos: Tamano[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DetalleProductoComponent>,
    private carritoService: CarritoService,
    private tamanoService: TamanoService,
    private dialog: MatDialog

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

      // ✅ Buscar tamaño "Personal"
      const tamanoPersonal = this.tamanos.find(t => t.Tamano.toLowerCase() === "personal");

      if (tamanoPersonal) {
        this.tamanoSeleccionado = tamanoPersonal;
        this.actualizarPrecio(); // ✅ Recalcular precio con variación
      } else {
        // 🟡 Si no existe "Personal", usar precio base
        this.tamanoSeleccionado = null;
        this.precioActual = this.data.precio;
      }
    },
    error: (err) => {
      console.error('Error al cargar tamaños:', err);
    },
  });
}



  // 🔹 Cuando se selecciona un tamaño
seleccionarTamano(t: Tamano) {
  this.dialogRef.close(t); // ✅ Devolver solo el tamaño
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
  if (this.cantidad > 1) this.cantidad--;
  }


  cerrar(): void {
    this.dialogRef.close();
  }

  agregarCarrito(): void {
  if (this.cantidad <= 0 || !this.tamanoSeleccionado) {
    alert('⚠️ Debe seleccionar un tamaño');
    return;
  }

  const subtotal = this.precioActual * this.cantidad;
  
  // ✅ CORRECCIÓN: Usar las propiedades correctas del objeto data
  const producto = {
    // IDs
    id: this.data.id || this.data.ID_Producto,
    ID_Producto: this.data.ID_Producto || this.data.id,
    
    // Información básica
    nombre: this.data.nombre || this.data.Nombre,
    descripcion: this.data.descripcion || this.data.Descripcion,
    
    // Precios
    precio: this.precioActual, // Precio con variación de tamaño incluida
    Precio_Base: this.data.precio || this.data.Precio_Base,
    
    // Cantidad y subtotal
    cantidad: this.cantidad,
    subtotal: subtotal,
    
    // Imagen
    imagen: this.data.imagen,
    
    // Tamaño
    tamano: this.tamanoSeleccionado.Tamano,
    idTamano: this.tamanoSeleccionado.ID_Tamano,
    ID_Tamano: this.tamanoSeleccionado.ID_Tamano,
    
    // Categoría (opcional)
    categoria: this.data.categoria || this.data.ID_Categoria_P
  };

  console.log('🛒 Producto a agregar al carrito:', JSON.stringify(producto, null, 2));
  this.carritoService.agregarProducto(producto);
  this.dialogRef.close();
}

abrirModalTamanos() {
  const dialogRef = this.dialog.open(TamanoProductoComponent, {
    width: '420px',
    data: {
      producto: this.data,
      tamanoSeleccionado: this.tamanoSeleccionado   // ✅ Pasamos el tamaño seleccionado actual
    }
  });

  dialogRef.afterClosed().subscribe((tamanoSeleccionado: Tamano | null) => {
    if (!tamanoSeleccionado) return;
    this.tamanoSeleccionado = tamanoSeleccionado;
    this.actualizarPrecio();
  });
}






}
