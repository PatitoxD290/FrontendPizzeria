import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import Swal from 'sweetalert2';

// Servicios y modelos
import { PedidoService } from '../../../../core/services/pedido.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { CombosService } from '../../../../core/services/combos.service';
import { Pedido, PedidoDetalle } from '../../../../core/models/pedido.model';
import { Cliente } from '../../../../core/models/cliente.model';
import { Producto } from '../../../../core/models/producto.model';

// 🔹 Interfaz extendida localmente para la vista
interface PedidoEnEspera extends Pedido {
  PrecioTotal: number; // ✅ Cambiado de any a number
  cliente?: Cliente;
  detallesCompletos?: (PedidoDetalle & {
    productoInfo?: Producto;
    comboInfo?: any;
    comboDetalles?: any[];
    tamanoInfo?: string;
    nombreItem?: string;
    precioUnitario?: number;
    precioTotal?: number;
  })[];
}

@Component({
  selector: 'app-pedido-espera-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatDividerModule,
  ],
  templateUrl: './pedido-espera-list.component.html',
  styleUrls: ['./pedido-espera-list.component.css'],
})
export class PedidoEsperaListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  pageSize = 6;
  pageIndex = 0;
  pageSizeOptions = [6, 12, 18];

  pedidos: PedidoEnEspera[] = [];
  isLoading: boolean = true;
  error: string = '';
  processingId: number | null = null;

  constructor(
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private comboService: CombosService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarPedidosEnEspera();
  }

  get pedidosPaginados() {
    const startIndex = this.pageIndex * this.pageSize;
    return this.pedidos.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cargarPedidosEnEspera(): void {
    this.isLoading = true;
    this.error = '';

    this.pedidoService.getPedidos().subscribe({
      next: async (pedidos) => {
        try {
          console.log('🔍 PEDIDOS RECIBIDOS DEL BACKEND:', pedidos);

          const pedidosFiltrados = pedidos.filter((p) => p.Estado_P === 'P');
          console.log('🔄 PEDIDOS FILTRADOS (PENDIENTES):', pedidosFiltrados);

          // Verificar SubTotal en cada pedido
          pedidosFiltrados.forEach((pedido, index) => {
            console.log(`📊 Pedido ${index + 1} - ID: ${pedido.ID_Pedido}:`, {
              SubTotal: pedido.SubTotal,
              Estado: pedido.Estado_P,
              TieneSubTotal: !!pedido.SubTotal,
            });
          });

          const pedidosOrdenados = pedidosFiltrados.sort((a, b) => {
            const fechaA = this.crearFechaCompleta(a.Fecha_Registro, a.Hora_Pedido);
            const fechaB = this.crearFechaCompleta(b.Fecha_Registro, b.Hora_Pedido);
            return fechaB.getTime() - fechaA.getTime();
          });

          this.pedidos = await this.cargarInformacionCompleta(pedidosOrdenados);

          console.log('✅ PEDIDOS FINALES PROCESADOS:', this.pedidos);
          this.pedidos.forEach((pedido) => {
            console.log(`🎯 Pedido #${pedido.ID_Pedido}:`, {
              SubTotal: pedido.SubTotal,
              PrecioTotal: pedido.PrecioTotal,
              DetallesCompletos: pedido.detallesCompletos?.length,
            });
          });

          this.isLoading = false;
          this.pageIndex = 0;
        } catch (error) {
          this.error = 'Error al procesar la información de los pedidos';
          this.isLoading = false;
          console.error('❌ Error:', error);
        }
      },
      error: (err) => {
        this.error = 'Error al conectar con el servidor';
        this.isLoading = false;
        console.error('❌ Error:', err);
      },
    });
  }

  private crearFechaCompleta(fecha: string, hora: string): Date {
    try {
      if (hora && hora.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
        return new Date(`${fecha}T${hora}`);
      }
      if (hora?.includes('T')) return new Date(hora);
      if (fecha) return new Date(fecha);
      return new Date();
    } catch {
      return new Date();
    }
  }

  private calcularTotalesPedido(pedido: PedidoEnEspera): void {
    console.log(`🔢 CALCULANDO TOTALES PARA PEDIDO #${pedido.ID_Pedido}`);

    // ✅ CALCULAR PrecioTotal a partir del SubTotal
    // En tu modelo, PrecioTotal = SubTotal (sin impuestos/descuentos adicionales)
    if (pedido.SubTotal && pedido.SubTotal > 0) {
      console.log(`✅ SubTotal desde BD: ${pedido.SubTotal}`);
      pedido.PrecioTotal = pedido.SubTotal; // ✅ PrecioTotal es igual a SubTotal
    } else {
      // Calcular SubTotal sumando todos los detalles
      const subTotalCalculado =
        pedido.detallesCompletos?.reduce((total, detalle) => {
          const precioDetalle = detalle.precioTotal || detalle.PrecioTotal || 0;
          console.log(`📦 Detalle ${detalle.nombreItem}: ${precioDetalle}`);
          return total + precioDetalle;
        }, 0) || 0;

      pedido.SubTotal = subTotalCalculado;
      pedido.PrecioTotal = subTotalCalculado; // ✅ PrecioTotal es igual a SubTotal
      console.log(`🧮 SubTotal calculado: ${subTotalCalculado}`);
    }

    console.log(`💰 TOTAL FINAL: ${pedido.PrecioTotal}`);
  }

  private async cargarInformacionCompleta(pedidos: Pedido[]): Promise<PedidoEnEspera[]> {
    const promesas = pedidos.map(async (pedido) => {
      const pedidoCompleto: PedidoEnEspera = {
        ...pedido,
        PrecioTotal: 0 // ✅ Inicializar en 0
      };

      try {
        if (pedido.ID_Cliente && pedido.ID_Cliente !== 1) {
          try {
            pedidoCompleto.cliente = await firstValueFrom(
              this.clienteService.getClienteById(pedido.ID_Cliente)
            );
          } catch {
            console.warn(`Cliente ${pedido.ID_Cliente} no encontrado`);
          }
        }

        try {
          const detalles = await firstValueFrom(
            this.pedidoService.getPedidoDetalles(pedido.ID_Pedido)
          );
          if (detalles) {
            pedidoCompleto.detallesCompletos = await this.enriquecerDetalles(detalles);
            this.calcularTotalesPedido(pedidoCompleto);
          }
        } catch {
          console.warn(`Detalles del pedido ${pedido.ID_Pedido} no encontrados`);
        }
      } catch (err) {
        console.error(`Error procesando pedido ${pedido.ID_Pedido}`, err);
      }

      return pedidoCompleto;
    });

    return Promise.all(promesas);
  }

  // ✅ CORREGIR el método getNombreCliente para aceptar PedidoEnEspera
  getNombreCliente(pedido: PedidoEnEspera): string {
    if (pedido.cliente) return `${pedido.cliente.Nombre} ${pedido.cliente.Apellido || ''}`;
    return pedido.Cliente_Nombre || 'Cliente General';
  }

  // ... (el resto de los métodos se mantienen igual)

  private async enriquecerDetalles(detalles: PedidoDetalle[]): Promise<any[]> {
    return Promise.all(detalles.map(async (detalle) => {
      let productoInfo: Producto | undefined;
      let comboInfo: any = undefined;
      let comboDetalles: any[] = [];
      let tamanoInfo = detalle.Tamano_Nombre || 'Tamaño único';
      let precioUnitario = 0;
      let nombreItem = '';

      try {
        if (detalle.ID_Combo) {
          try {
            comboInfo = await firstValueFrom(this.comboService.getComboById(detalle.ID_Combo));
            nombreItem = comboInfo.Nombre || detalle.Nombre_Combo || 'Combo';
            precioUnitario = comboInfo.Precio || 0;
            tamanoInfo = '(Combo)';
            
            if (comboInfo.detalles && Array.isArray(comboInfo.detalles)) {
              comboDetalles = comboInfo.detalles.map((cd: any) => ({
                nombreProducto: cd.Producto_Nombre || 'Producto',
                tamano: cd.Tamano_Nombre || 'Normal',
                cantidad: cd.Cantidad || 1,
                idProductoT: cd.ID_Producto_T
              }));
            }
          } catch (err) {
            console.warn('Error obteniendo info del combo:', err);
            nombreItem = detalle.Nombre_Combo || 'Combo';
            precioUnitario = detalle.PrecioTotal / detalle.Cantidad;
          }
        } else if (detalle.ID_Producto_T) {
          productoInfo = await this.obtenerProductoPorTamano(detalle.ID_Producto_T);
          nombreItem = productoInfo?.Nombre || detalle.Nombre_Producto || 'Producto';
          
          if (!detalle.Tamano_Nombre && productoInfo?.tamanos?.[0]) {
            tamanoInfo = productoInfo.tamanos[0].nombre_tamano || 'Tamaño único';
          }

          if (productoInfo?.tamanos?.[0]?.Precio) {
            precioUnitario = productoInfo.tamanos[0].Precio;
          }
        }
      } catch (err) {
        console.warn('Error obteniendo info del item:', err);
      }

      if (!precioUnitario && detalle.Cantidad > 0) {
        precioUnitario = detalle.PrecioTotal / detalle.Cantidad;
      }

      const precioTotalCalculado = detalle.PrecioTotal || (precioUnitario * detalle.Cantidad) || 0;

      console.log(`📊 Detalle procesado:`, {
        nombre: nombreItem,
        cantidad: detalle.Cantidad,
        precioUnitario: precioUnitario,
        precioTotal: precioTotalCalculado,
        tipo: detalle.ID_Combo ? 'combo' : 'producto'
      });

      return {
        ...detalle,
        productoInfo,
        comboInfo,
        comboDetalles,
        tamanoInfo,
        nombreItem,
        precioUnitario: precioUnitario || 0,
        precioTotal: precioTotalCalculado
      };
    }));
  }

  private async obtenerProductoPorTamano(idProductoTamano: number): Promise<Producto | undefined> {
    try {
      const productos = await firstValueFrom(this.productoService.getProductos());
      for (const p of productos || []) {
        const tamano = p.tamanos?.find((t) => t.ID_Producto_T === idProductoTamano);
        if (tamano) return { ...p, tamanos: [tamano] };
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  cambiarEstado(pedido: PedidoEnEspera, nuevoEstado: 'E' | 'C') { // ✅ Cambiado a PedidoEnEspera
    const accion = nuevoEstado === 'E' ? 'entregar' : 'cancelar';
    const colorBtn = nuevoEstado === 'E' ? '#2e7d32' : '#d32f2f';
    const cliente = this.getNombreCliente(pedido);

    Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} pedido?`,
      html: `Pedido <strong>#${pedido.ID_Pedido}</strong> de <strong>${cliente}</strong>`,
      icon: nuevoEstado === 'E' ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      confirmButtonColor: colorBtn,
      cancelButtonText: 'Volver',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarCambioEstado(pedido.ID_Pedido, nuevoEstado);
      }
    });
  }

  private procesarCambioEstado(id: number, estado: 'E' | 'C') {
    this.processingId = id;

    this.pedidoService.statusPedido(id, estado).subscribe({
      next: () => {
        const msg = estado === 'E' ? 'Pedido entregado.' : 'Pedido cancelado.';
        Swal.fire({
          icon: 'success',
          title: 'Listo',
          text: msg,
          timer: 1500,
          showConfirmButton: false,
        });

        this.pedidos = this.pedidos.filter((p) => p.ID_Pedido !== id);
        if (this.pedidosPaginados.length === 0 && this.pageIndex > 0) {
          this.pageIndex--;
        }

        this.processingId = null;
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo cambiar el estado.', 'error');
        this.processingId = null;
      },
    });
  }

  getHoraFormateada(hora: string): string {
    if (!hora) return '';
    if (hora.match(/^\d{1,2}:\d{2}/)) {
      const [h, m] = hora.split(':');
      return `${h}:${m}`;
    }
    try {
      return new Date(hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return hora;
    }
  }

  getTiempoEspera(fecha: string, hora: string): string {
    const fechaPedido = this.crearFechaCompleta(fecha, hora);
    const diff = Date.now() - fechaPedido.getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    return `${h}h ${mins % 60}m`;
  }

  esTiempoCritico(fecha: string, hora: string): boolean {
    const fechaPedido = this.crearFechaCompleta(fecha, hora);
    const diff = Date.now() - fechaPedido.getTime();
    return diff > 30 * 60000;
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'P':
        return 'primary';
      case 'D':
        return 'accent';
      case 'E':
        return 'primary';
      case 'C':
        return 'warn';
      default:
        return 'primary';
    }
  }

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'P':
        return 'Pendiente';
      case 'D':
        return 'En preparación';
      case 'E':
        return 'Entregado';
      case 'C':
        return 'Cancelado';
      default:
        return estado;
    }
  }

  refrescar(): void {
    this.cargarPedidosEnEspera();
    this.snackBar.open('Lista actualizada', 'Cerrar', {
      duration: 2000,
    });
  }
}