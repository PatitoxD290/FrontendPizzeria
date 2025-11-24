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

  private baseUrl = 'http://localhost:3000'; // Ajusta tu puerto si es necesario

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, // Puede ser Producto o Combo
    private dialogRef: MatDialogRef<DetalleProductoComponent>,
    private carritoService: CarritoService,
    public complementoService: ComplementoService,
    private dialog: MatDialog,
    private modalStateService: ModalStateService
  ) {}

  ngOnInit(): void {
    this.modalStateService.abrirModal();
    this.complementoService.limpiarComplementosTemporales();
    this.inicializarDatos();
    this.verificarEstadoComplementos();
  }

  ngOnDestroy(): void {
    this.modalStateService.cerrarModal();
  }

  private inicializarDatos() {
    this.esCombo = !!this.data.ID_Combo;

    if (this.esCombo) {
      const combo = this.data as Combo;
      this.nombre = combo.Nombre;
      this.descripcion = combo.Descripcion;
      this.precioBase = Number(combo.Precio);
      
      // ✅ CORRECCIÓN: Usar lógica segura para extraer nombre de imagen
      this.imagen = this.construirUrlImagen(combo.imagenes);
      
      this.esBebida = false; 

    } else {
      const producto = this.data as Producto;
      this.nombre = producto.Nombre;
      this.descripcion = producto.Descripcion;
      
      // ✅ CORRECCIÓN: Usar lógica segura para extraer nombre de imagen
      this.imagen = this.construirUrlImagen(producto.imagenes);

      this.tamanosDisponibles = producto.tamanos?.filter(t => t.Estado === 'A') || [];
      if (this.tamanosDisponibles.length > 0) {
        this.seleccionarTamano(this.tamanosDisponibles[0]);
      }

      const cat = producto.nombre_categoria?.toLowerCase() || '';
      this.esBebida = cat.includes('bebida') || cat.includes('refresco');
    }
  }

  // 🖼️ Helper para construir URL de imagen limpia
  private construirUrlImagen(imagenes?: string[]): string {
    if (imagenes && imagenes.length > 0) {
      // Extraer solo el nombre del archivo (ej: producto_1_1.jpg) eliminando rutas como 'uploads/' o '\'
      const filename = imagenes[0].split(/[/\\]/).pop();
      return `${this.baseUrl}/imagenesCata/${filename}`;
    }
    return 'assets/imgs/no-image.png';
  }

  seleccionarTamano(tamano: ProductoTamano) {
    this.tamanoSeleccionado = tamano;
    this.precioBase = Number(tamano.Precio);
  }

  incrementar() {
    if (!this.esCombo) {
      const stock = (this.data as Producto).Cantidad_Disponible;
      if (this.cantidad >= stock) return;
    }
    this.cantidad++;
  }

  decrementar() {
    if (this.cantidad > 1) this.cantidad--;
  }

  abrirComplementos() {
    const dialogRef = this.dialog.open(ComplementoProductoComponent, {
      width: '800px',
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '90vh',
      disableClose: false,
      data: { 
        titulo: this.esCombo ? 'Elige tus bebidas' : 'Agregar complementos'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.verificarEstadoComplementos();
      }
    });
  }

  verificarEstadoComplementos() {
    this.tieneComplementos = this.complementoService.tieneComplementos();
    this.cantidadComplementos = this.complementoService.obtenerCantidadComplementos();
  }

  // 🛒 Agregar al Carrito
  agregarAlCarrito() {
    if (this.cantidad <= 0) return;

    // 1. Construir ítem principal
    const itemPrincipal: DatosPedido = {
      id: Date.now(),
      
      // Usar undefined en lugar de null para opcionales
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
    event.target.src = 'assets/imgs/no-image.png';
  }

  cerrar() {
    this.dialogRef.close();
  }
}