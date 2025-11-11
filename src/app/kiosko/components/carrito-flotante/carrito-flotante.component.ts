import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CarritoService } from '../../../core/services/carrito.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ModalStateService } from '../../../core/services/modal-state.service'; // ✅ Nuevo import
import { Subscription } from 'rxjs'; // ✅ Nuevo import

@Component({
  selector: 'app-carrito-flotante',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './carrito-flotante.component.html',
  styleUrls: ['./carrito-flotante.component.css']
})
export class CarritoFlotanteComponent implements OnInit, OnDestroy {
  esPaginaCarrito = false;
  modalAbierto = false; // ✅ Nueva propiedad
  private modalSubscription!: Subscription; // ✅ Nueva suscripción

  constructor(
    public carritoService: CarritoService,
    public router: Router,
    private location: Location,
    private modalStateService: ModalStateService // ✅ Inyectar servicio
  ) {}

  ngOnInit() {
    this.esPaginaCarrito = this.router.url.includes('/carrito');
    
    // ✅ Suscribirse al estado de los modales
    this.modalSubscription = this.modalStateService.modalAbierto$.subscribe(
      (abierto) => {
        this.modalAbierto = abierto;
      }
    );
  }

  ngOnDestroy() {
    // ✅ Limpiar suscripción
    if (this.modalSubscription) {
      this.modalSubscription.unsubscribe();
    }
  }

  esPaginaPago(): boolean {
    return this.router.url.includes('/pago');
  }

  toggleCarrito() {
  // ✅ No hacer nada si hay modales abiertos o está en página de pago
  if (this.modalAbierto || this.esPaginaPago()) {
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
    
    this.router.navigate(['kiosko/pago']);
  }

  vaciarCarrito() {
    this.carritoService.vaciarCarrito();
  }

  get cantidadItemsDistintos(): number {
    return this.carritoService.obtenerProductos().length;
  }

  get total(): number {
    return this.carritoService.obtenerTotal();
  }
}