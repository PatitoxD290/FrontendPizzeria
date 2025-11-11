import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../../core/services/carrito.service';
import { ComplementoService } from '../../../core/services/complemento.service';
import { ProductoTamano } from '../../../core/models/producto.model';
import { ComplementoProductoComponent } from '../complemento-producto/complemento-producto.component';
import { MatIconModule } from '@angular/material/icon';
import { ModalStateService } from '../../../core/services/modal-state.service';

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
  tamanoSeleccionado: ProductoTamano | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DetalleProductoComponent>,
    private carritoService: CarritoService,
    public complementoService: ComplementoService,
    private dialog: MatDialog,
    private modalStateService: ModalStateService
  ) {}

  ngOnInit(): void {
    // 🔹 CAMBIO: Usar el nuevo método
    this.modalStateService.abrirModal();
    
    this.verificarSiEsBebida();
    this.verificarComplementos();
    
    if (this.data.tamanos && this.data.tamanos.length > 0) {
      this.tamanoSeleccionado = this.data.tamanos[0];
    }
  }

  ngOnDestroy(): void {
    // 🔹 CAMBIO: Usar el nuevo método
    this.modalStateService.cerrarModal();
  }

  verificarSiEsBebida(): void {
    const nombreCategoria = this.data.nombre_categoria?.toLowerCase() || '';
    this.esBebida = nombreCategoria.includes('bebida') || 
                    nombreCategoria.includes('bebidas');
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

  seleccionarTamano(tamano: ProductoTamano): void {
    this.tamanoSeleccionado = tamano;
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
      // 🔹 IMPORTANTE: No llamamos cerrarModal() aquí porque 
      // ComplementoProductoComponent maneja su propio ciclo de vida
    });
  }

  agregarCarrito(): void {
    if (this.cantidad <= 0 || !this.tamanoSeleccionado) {
      return;
    }

    const productoPrincipal = {
      ID_Producto: this.data.ID_Producto,
      ID_Producto_T: this.tamanoSeleccionado.ID_Producto_T,
      nombre: this.data.Nombre,
      descripcion: this.data.Descripcion,
      precio: this.tamanoSeleccionado.Precio,
      cantidad: this.cantidad,
      subtotal: this.tamanoSeleccionado.Precio * this.cantidad,
      imagen: this.data.imagen || 'assets/default-product.png',
      nombre_tamano: this.tamanoSeleccionado.nombre_tamano || 'Tamaño único',
      ID_Tamano: this.tamanoSeleccionado.ID_Tamano,
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

  get precioUnitario(): number {
    return this.tamanoSeleccionado?.Precio || 0;
  }

  get precioTotal(): number {
    return this.precioUnitario * this.cantidad;
  }

  get cantidadComplementos(): number {
    return this.complementoService.obtenerCantidadComplementos();
  }
}