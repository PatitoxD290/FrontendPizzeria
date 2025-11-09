import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { CommonModule, NgIf } from '@angular/common';
import { CarritoService } from '../../../core/services/carrito.service';
import { ComplementoService } from '../../../core/services/complemento.service';
import { ProductoTamano } from '../../../core/models/producto.model';
import { ComplementoProductoComponent } from '../complemento-producto/complemento-producto.component';
import { MatIconModule } from '@angular/material/icon';
import { ModalStateService } from '../../../core/services/modal-state.service'; // ✅ Nuevo import

@Component({
  selector: 'app-detalle-producto',
  templateUrl: './detalle-producto.component.html',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  styleUrls: ['./detalle-producto.component.css'],
})
export class DetalleProductoComponent implements OnInit, OnDestroy {
  cantidad: number = 1;
  tieneComplementos: boolean = false;
  esBebida: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DetalleProductoComponent>,
    private carritoService: CarritoService,
    public complementoService: ComplementoService,
    private dialog: MatDialog,
    private modalStateService: ModalStateService // ✅ Inyectar servicio
  ) {}

  ngOnInit(): void {
    // ✅ Notificar que el modal está abierto
    this.modalStateService.setModalAbierto(true);
    
    this.verificarSiEsBebida();
    this.verificarComplementos();
  }

  ngOnDestroy(): void {
    // ✅ Notificar que el modal se cerró
    this.modalStateService.setModalAbierto(false);
  }

  // ✅ Método para verificar si el producto es una bebida
  verificarSiEsBebida(): void {
    const nombreCategoria = this.data.nombre_categoria?.toLowerCase() || '';
    this.esBebida = nombreCategoria.includes('bebida') || 
                    nombreCategoria.includes('bebidas');
    
    console.log('Categoría del producto:', this.data.nombre_categoria);
    console.log('¿Es bebida?:', this.esBebida);
  }

  verificarComplementos(): void {
    this.tieneComplementos = this.complementoService.tieneComplementos();
  }

  incrementarCantidad(): void {
    this.cantidad++;
  }

  decrementarCantidad(): void {
    if (this.cantidad > 1) this.cantidad--;
  }

  cerrar(): void {
    this.complementoService.limpiarComplementosTemporales();
    this.dialogRef.close();
  }

  abrirComplementos(): void {
    const dialogRef = this.dialog.open(ComplementoProductoComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.complementosSeleccionados) {
        this.verificarComplementos();
      }
    });
  }

  agregarCarrito(): void {
    if (this.cantidad <= 0) {
      return;
    }

    const primerTamano = this.data.tamanos && this.data.tamanos.length > 0 
      ? this.data.tamanos[0] 
      : null;

    if (!primerTamano) {
      return;
    }

    const productoPrincipal = {
      ID_Producto: this.data.ID_Producto,
      ID_Producto_T: primerTamano.ID_Producto_T,
      nombre: this.data.Nombre,
      descripcion: this.data.Descripcion,
      precio: primerTamano.Precio,
      cantidad: this.cantidad,
      subtotal: primerTamano.Precio * this.cantidad,
      imagen: this.data.imagen || 'assets/default-product.png',
      nombre_tamano: primerTamano.nombre_tamano || 'Tamaño único',
      ID_Tamano: primerTamano.ID_Tamano,
      ID_Categoria_P: this.data.ID_Categoria_P,
      esPrincipal: true
    };

    this.carritoService.agregarProducto(productoPrincipal);

    const complementos = this.complementoService.obtenerComplementosTemporales();
    if (complementos.length > 0) {
      complementos.forEach(complemento => {
        this.carritoService.agregarProducto(complemento);
      });
    }

    this.complementoService.limpiarComplementosTemporales();

    this.dialogRef.close({ 
      agregar: true, 
      producto: productoPrincipal,
      complementosAgregados: complementos.length 
    });
  }

  get nombreTamanoActual(): string {
    const primerTamano = this.data.tamanos && this.data.tamanos.length > 0 
      ? this.data.tamanos[0] 
      : { nombre_tamano: 'Tamaño único' };
    return primerTamano.nombre_tamano || 'Tamaño único';
  }

  get precioUnitario(): number {
    const primerTamano = this.data.tamanos && this.data.tamanos.length > 0 
      ? this.data.tamanos[0] 
      : { Precio: 0 };
    return primerTamano.Precio || 0;
  }

  get precioTotal(): number {
    return this.precioUnitario * this.cantidad;
  }

  get cantidadComplementos(): number {
    return this.complementoService.obtenerCantidadComplementos();
  }
}