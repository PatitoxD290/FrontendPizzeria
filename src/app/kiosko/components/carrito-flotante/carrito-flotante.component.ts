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

  constructor(
    public carritoService: CarritoService,
    public router: Router,
    private location: Location,
    private modalStateService: ModalStateService,
    private cdr: ChangeDetectorRef // ✅ Cambiado a cdr para coincidir con el diseño
  ) {}

  ngOnInit() {
    // Verificar rutas iniciales
    this.checkRoute();
    
    // Suscribirse al estado de los modales
    this.modalSubscription = this.modalStateService.modalAbierto$.subscribe(
      (abierto) => {
        this.modalAbierto = abierto;
        this.cdr.detectChanges(); // ✅ Forzar detección de cambios
      }
    );

    // Detectar cambios de ruta
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkRoute();
        this.cdr.detectChanges(); // ✅ Forzar detección de cambios
      });
  }

  ngOnDestroy() {
    if (this.modalSubscription) {
      this.modalSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  checkRoute() {
    // Actualizamos las variables de estado
    this.esPaginaCarrito = this.router.url.includes('/carrito');
    this.esPaginaPagoVariable = this.router.url.includes('/pago');
  }

  // Getter simple para usar en el HTML en lugar de función
  get esPaginaPago(): boolean {
    return this.esPaginaPagoVariable;
  }

  toggleCarrito() {
    // ✅ No hacer nada si hay modales abiertos o está en página de pago
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
    if (this.carritoService.obtenerProductos().length === 0) {
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

  // Getters
  get cantidadItemsDistintos(): number {
    return this.carritoService.obtenerCantidadItems();
  }

  get total(): number {
    return this.carritoService.obtenerTotal();
  }
  
  get productos(): DatosPedido[] {
    return this.carritoService.obtenerProductos();
  }
}