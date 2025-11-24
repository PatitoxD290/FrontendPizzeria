import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Servicios y Modelos
import { CarritoService } from '../../../core/services/carrito.service';
import { ComplementoService } from '../../../core/services/complemento.service';
import { ModalStateService } from '../../../core/services/modal-state.service';
import { Producto, ProductoTamano } from '../../../core/models/producto.model';
import { Combo } from '../../../core/models/combo.model';
import { DatosPedido } from '../../../core/models/pedido.model';
import { ComplementoProductoComponent } from '../complemento-producto/complemento-producto.component';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './detalle-producto.component.html',
  styleUrls: ['./detalle-producto.component.css'],
})
export class DetalleProductoComponent implements OnInit, OnDestroy {
  
  // Datos
  cantidad: number = 1;
  tamanoSeleccionado: ProductoTamano | null = null;
  tamanosDisponibles: ProductoTamano[] = [];
  
  // Estados
  esCombo: boolean = false;
  esBebida: boolean = false;
  tieneComplementos: boolean = false;
  cantidadComplementos: number = 0;

  // Datos visuales
  nombre: string = '';
  descripcion: string = '';
  imagen: string = '';
  precioBase: number = 0;

  private baseUrl = 'http://localhost:3000';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DetalleProductoComponent>,
    private carritoService: CarritoService,
    public complementoService: ComplementoService,
    private dialog: MatDialog,
    private modalStateService: ModalStateService
  ) {}

  ngOnInit(): void {
    // ✅ USAR setTimeout PARA EL PRÓXIMO CICLO
    setTimeout(() => {
      this.modalStateService.abrirModal();
    });
    
    this.complementoService.limpiarComplementosTemporales();
    this.inicializarDatos();
    this.verificarEstadoComplementos();
  }

  ngOnDestroy(): void {
    // ✅ USAR setTimeout PARA EL PRÓXIMO CICLO
    setTimeout(() => {
      this.modalStateService.cerrarModal();
    });
  }

private inicializarDatos() {
  this.esCombo = !!this.data.ID_Combo;

  if (this.esCombo) {
    const combo = this.data as Combo;
    this.nombre = combo.Nombre;
    this.descripcion = combo.Descripcion;
    this.precioBase = Number(combo.Precio);
    this.imagen = this.construirUrlImagenCompleta(combo);
    this.esBebida = false;
  } else {
    const producto = this.data as Producto;
    this.nombre = producto.Nombre;
    this.descripcion = producto.Descripcion;
    this.imagen = this.construirUrlImagenCompleta(producto);

    this.tamanosDisponibles = producto.tamanos?.filter(t => t.Estado === 'A') || [];
    if (this.tamanosDisponibles.length > 0) {
      this.seleccionarTamano(this.tamanosDisponibles[0]);
    }

    const cat = producto.nombre_categoria?.toLowerCase() || '';
    this.esBebida = cat.includes('bebida') || cat.includes('refresco');
  }
}


private construirUrlImagenCompleta(item: any): string {
  // Si ya viene con imagen del menú, usarla
  if (item.imagen && item.imagen !== '/assets/imgs/logo.png') {
    return item.imagen;
  }
  
  // Si no, construirla
  const id = this.esCombo ? item.ID_Combo : item.ID_Producto;
  const tipo = this.esCombo ? 'combo' : 'producto';
  const urlBase = `${this.baseUrl}/imagenesCata/${tipo}_${id}_1`;
  
  return urlBase;
}

  // 🖼️ Helper para construir URL de imagen limpia
private construirUrlImagen(imagenes?: string[]): string {
  if (imagenes && imagenes.length > 0) {
    const filename = imagenes[0].split(/[/\\]/).pop();
    return `${this.baseUrl}/imagenesCata/${filename}`;
  }
  
  // 🔹 NUEVO: Si no hay imagen en el array, intentar construirla desde los datos
  if (this.data && this.data.ID_Producto) {
    const id = this.data.ID_Producto;
    const tipo = this.esCombo ? 'combo' : 'producto';
    return `${this.baseUrl}/imagenesCata/${tipo}_${id}_1.png`;
  }
  
  return 'assets/imgs/no-image.png';
}

  seleccionarTamano(tamano: ProductoTamano) {
    this.tamanoSeleccionado = tamano;
    this.precioBase = Number(tamano.Precio);
  }

  incrementarCantidad(): void {
    if (!this.esCombo) {
      const stock = (this.data as Producto).Cantidad_Disponible;
      if (this.cantidad >= stock) return;
    }
    this.cantidad++;
  }

  decrementarCantidad(): void {
    if (this.cantidad > 1) this.cantidad--;
  }

  abrirComplementos(): void {
    const dialogRef = this.dialog.open(ComplementoProductoComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        esCombo: this.esCombo
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.complementosSeleccionados) {
        this.verificarEstadoComplementos();
      }
    });
  }

  verificarEstadoComplementos(): void {
    this.tieneComplementos = this.complementoService.tieneComplementos();
    this.cantidadComplementos = this.complementoService.obtenerCantidadComplementos();
  }

  // 🔹 NUEVO: Determinar si se pueden agregar complementos
  get puedeAgregarComplementos(): boolean {
    if (this.esCombo) {
      return true;
    } else {
      return !this.esBebida;
    }
  }

  // 🔹 NUEVO: Obtener el texto del tipo de producto
  get tipoProducto(): string {
    return this.esCombo ? 'Combo' : 'Producto';
  }

  // 🔹 NUEVO: Obtener precio unitario
  get precioUnitario(): number {
    return this.precioBase;
  }

  // 🔹 NUEVO: Obtener precio total
  get precioTotal(): number {
    return this.precioUnitario * this.cantidad;
  }

  // 🛒 Agregar al Carrito
  agregarAlCarrito() {
    if (this.cantidad <= 0) return;

    // 1. Construir ítem principal
    const itemPrincipal: DatosPedido = {
      id: Date.now(),
      idProductoT: this.esCombo ? undefined : (this.tamanoSeleccionado?.ID_Producto_T || undefined),
      idCombo: this.esCombo ? this.data.ID_Combo : undefined,
      nombre: this.nombre,
      cantidad: this.cantidad,
      precioUnitario: this.precioBase,
      precioTotal: this.precioBase * this.cantidad,
      tamano: this.esCombo ? 'Combo' : (this.tamanoSeleccionado?.nombre_tamano || 'Estándar'),
      esCombo: this.esCombo,
      descripcion: this.descripcion
    };

    console.log('🛒 Agregando principal:', itemPrincipal);
    this.carritoService.agregarProducto(itemPrincipal);

    // 2. Agregar complementos
    if (this.tieneComplementos) {
      const complementos = this.complementoService.obtenerComplementosTemporales();
      
      complementos.forEach(comp => {
        const itemComplemento: DatosPedido = {
          id: Date.now() + Math.random(),
          idProductoT: comp.ID_Producto_T,
          idCombo: undefined,
          nombre: `+ ${comp.Nombre}`,
          cantidad: comp.Cantidad * this.cantidad,
          precioUnitario: comp.Precio,
          precioTotal: (comp.Precio * comp.Cantidad) * this.cantidad,
          tamano: 'Complemento',
          esCombo: false,
          descripcion: `Acompañamiento para ${this.nombre}`
        };
        
        this.carritoService.agregarProducto(itemComplemento);
      });
      
      this.complementoService.limpiarComplementosTemporales();
    }

    Swal.fire({
      icon: 'success',
      title: 'Agregado',
      text: `${this.nombre} se agregó al pedido`,
      timer: 1000,
      showConfirmButton: false,
      position: 'top-end',
      toast: true
    });

    this.dialogRef.close(true);
  }

  onImageError(event: any) {
    event.target.src = '/assets/imgs/logo-aita/logo.png';
  }

  cerrar(): void {
    this.complementoService.limpiarComplementosTemporales();
    this.dialogRef.close();
  }
}