import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

// Servicios y Modelos
import { CarritoService } from '../../../core/services/carrito.service';
import { ModalStateService } from '../../../core/services/modal-state.service';
import { DatosPedido } from '../../../core/models/pedido.model';

@Component({
  selector: 'app-carrito-flotante',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './carrito-flotante.component.html',
  styleUrls: ['./carrito-flotante.component.css']
})
export class CarritoFlotanteComponent implements OnInit, OnDestroy {
  
  esPaginaCarrito = false;
  esPaginaPagoVariable = false;
  modalAbierto = false;
  private modalSubscription!: Subscription;
  private routerSubscription!: Subscription;
  private carritoSubscription!: Subscription;

  // Variables reactivas
  productos: DatosPedido[] = [];
  total: number = 0;
  cantidadItemsDistintos: number = 0;

  constructor(
    public carritoService: CarritoService,
    public router: Router,
    private location: Location,
    private modalStateService: ModalStateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Verificar rutas iniciales
    this.checkRoute();
    
    // Suscribirse al estado de los modales
    this.modalSubscription = this.modalStateService.modalAbierto$.subscribe(
      (abierto) => {
        this.modalAbierto = abierto;
        this.cdr.detectChanges();
      }
    );

    // Detectar cambios de ruta
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkRoute();
        this.cdr.detectChanges();
      });

    // 🔹 NUEVO: Suscribirse a cambios en el carrito
    this.carritoSubscription = this.carritoService.productos$.subscribe(
      (productos) => {
        this.productos = productos;
        this.total = this.carritoService.obtenerTotal();
        this.cantidadItemsDistintos = this.carritoService.obtenerCantidadItems();
        this.cdr.detectChanges(); // Forzar actualización de la vista
        console.log('🔄 Carrito actualizado en componente:', {
          productos: this.productos,
          total: this.total,
          cantidad: this.cantidadItemsDistintos
        });
      }
    );

    // Cargar estado inicial
    this.actualizarEstadoCarrito();
  }

  ngOnDestroy() {
    if (this.modalSubscription) {
      this.modalSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.carritoSubscription) {
      this.carritoSubscription.unsubscribe();
    }
  }

  // 🔹 NUEVO: Actualizar estado del carrito
  private actualizarEstadoCarrito(): void {
    this.productos = this.carritoService.obtenerProductos();
    this.total = this.carritoService.obtenerTotal();
    this.cantidadItemsDistintos = this.carritoService.obtenerCantidadItems();
    this.cdr.detectChanges();
  }

  checkRoute() {
    this.esPaginaCarrito = this.router.url.includes('/carrito');
    this.esPaginaPagoVariable = this.router.url.includes('/pago');
  }

  get esPaginaPago(): boolean {
    return this.esPaginaPagoVariable;
  }

  toggleCarrito() {
    if (this.modalAbierto || this.esPaginaPago) {
      console.log('Botón bloqueado - Modal abierto:', this.modalAbierto);
      return;
    }
    
    this.router.navigate(['/kiosko/carrito']);
  }

  volver() {
    if (this.esPaginaCarrito) {
      this.location.back();
    }
  }

  // Acciones del carrito
  eliminarProducto(index: number) {
    this.carritoService.eliminarProducto(index);
  }

  incrementarCantidad(index: number) {
    this.carritoService.incrementarCantidad(index);
  }

  decrementarCantidad(index: number) {
    this.carritoService.decrementarCantidad(index);
  }

  confirmarPedido() {
    if (this.productos.length === 0) {
      alert('⚠️ El carrito está vacío.');
      return;
    }
    this.router.navigate(['/kiosko/pago']);
  }

  vaciarCarrito() {
    if(confirm('¿Estás seguro de vaciar el carrito?')) {
      this.carritoService.vaciarCarrito();
    }
  }
}