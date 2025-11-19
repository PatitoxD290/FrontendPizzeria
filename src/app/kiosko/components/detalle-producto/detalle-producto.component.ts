// detalle-producto.component.ts
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
  esCombo: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DetalleProductoComponent>,
    private carritoService: CarritoService,
    public complementoService: ComplementoService,
    private dialog: MatDialog,
    private modalStateService: ModalStateService
  ) {}

  ngOnInit(): void {
    this.modalStateService.abrirModal();
    
    // 🔹 DETERMINAR SI ES UN COMBO O PRODUCTO INDIVIDUAL
    this.esCombo = this.data.esCombo || false;
    
    // 🔹 CAMBIO: LOS COMBOS TAMBIÉN PUEDEN TENER COMPLEMENTOS
    this.verificarSiEsBebida();
    this.verificarComplementos();
    
    if (!this.esCombo && this.data.tamanos && this.data.tamanos.length > 0) {
      this.tamanoSeleccionado = this.data.tamanos[0];
    }
  }

  ngOnDestroy(): void {
    this.modalStateService.cerrarModal();
  }

  verificarSiEsBebida(): void {
    if (this.esCombo) {
      // 🔹 CAMBIO: Los combos pueden contener bebidas, pero igual pueden tener complementos adicionales
      this.esBebida = false; // Los combos siempre pueden tener complementos adicionales
    } else {
      const nombreCategoria = this.data.nombre_categoria?.toLowerCase() || '';
      this.esBebida = nombreCategoria.includes('bebida') || 
                      nombreCategoria.includes('bebidas');
    }
  }

  verificarComplementos(): void {
    // 🔹 CAMBIO: Tanto productos como combos pueden tener complementos
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
    // 🔹 CAMBIO: TANTO PRODUCTOS COMO COMBOS PUEDEN TENER COMPLEMENTOS
    const dialogRef = this.dialog.open(ComplementoProductoComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        esCombo: this.esCombo // 🔹 Opcional: pasar información si es combo
      }
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

    // 🔹 AGREGAR COMBO
      if (this.esCombo) {
    const combo = {
      ID_Combo: this.data.ID_Combo,
      nombre: this.data.Nombre,
      descripcion: this.data.Descripcion,
      precio: this.data.Precio || this.data.precioMinimo || this.data.precio, // 🔹 MÚLTIPLES FUENTES DE PRECIO
      cantidad: this.cantidad,
      subtotal: (this.data.Precio || this.data.precioMinimo || this.data.precio) * this.cantidad,
      imagen: this.data.imagen || 'assets/default-combo.png',
      nombre_combo: this.data.Nombre,
      esCombo: true
    };

      console.log('🛒 Agregando combo al carrito:', combo);

      this.carritoService.agregarProducto(combo);

      // 🔹 CAMBIO: LOS COMBOS TAMBIÉN PUEDEN TENER COMPLEMENTOS
      const complementos = this.complementoService.obtenerComplementosTemporales();
      if (complementos.length > 0) {
        complementos.forEach(complemento => {
          // 🔹 Marcar complementos como asociados al combo
          const complementoConCombo = {
            ...complemento,
            ID_Combo_Asociado: this.data.ID_Combo, // 🔹 NUEVO: Relacionar con el combo
            esComplementoCombo: true
          };
          this.carritoService.agregarProducto(complementoConCombo);
        });
      }

      this.complementoService.limpiarComplementosTemporales();

      this.dialogRef.close({ 
        agregar: true, 
        combo: combo,
        complementosAgregados: complementos.length,
        tipo: 'combo'
      });
    } 
    // 🔹 AGREGAR PRODUCTO INDIVIDUAL
    else if (this.tamanoSeleccionado) {
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
        complementosAgregados: complementos.length,
        tipo: 'producto'
      });
    }
  }

  get precioUnitario(): number {
    if (this.esCombo) {
      return this.data.Precio || 0;
    } else {
      return this.tamanoSeleccionado?.Precio || 0;
    }
  }

  get precioTotal(): number {
    return this.precioUnitario * this.cantidad;
  }

  get cantidadComplementos(): number {
    // 🔹 CAMBIO: Tanto productos como combos pueden tener complementos
    return this.complementoService.obtenerCantidadComplementos();
  }

  // 🔹 NUEVO: Obtener el texto del tipo de producto
  get tipoProducto(): string {
    return this.esCombo ? 'Combo' : 'Producto';
  }

  // 🔹 NUEVO: Determinar si se pueden agregar complementos
  get puedeAgregarComplementos(): boolean {
    // 🔹 CAMBIO: Tanto productos como combos pueden tener complementos, excepto bebidas individuales
    if (this.esCombo) {
      return true; // Los combos siempre pueden tener complementos adicionales
    } else {
      return !this.esBebida; // Los productos individuales solo si no son bebidas
    }
  }
}