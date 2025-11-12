import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator'; // Añadir paginación
import Swal from 'sweetalert2';

// Servicios y modelos
import { PedidoService } from '../../../../core/services/pedido.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { Pedido, PedidoDetalle } from '../../../../core/models/pedido.model';
import { Cliente } from '../../../../core/models/cliente.model';
import { Producto, ProductoTamano } from '../../../../core/models/producto.model';

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
    MatPaginatorModule // Añadir paginación
  ],
  templateUrl: './pedido-espera-list.component.html',
  styleUrls: ['./pedido-espera-list.component.css']
})
export class PedidoEsperaListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Propiedades para paginación
  pageSize = 6; // Número de cards por página
  pageIndex = 0; // Página actual
  pageSizeOptions = [6, 12, 18]; // Opciones de items por página

  pedidos: (Pedido & {
    cliente?: Cliente;
    detallesCompletos?: (PedidoDetalle & {
      productoInfo?: Producto;
      tamanoInfo?: string;
    })[];
  })[] = [];

  isLoading: boolean = true;
  error: string = '';

  constructor(
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarPedidosEnEspera();
  }

  // Getter para obtener los pedidos paginados
  get pedidosPaginados() {
    const startIndex = this.pageIndex * this.pageSize;
    return this.pedidos.slice(startIndex, startIndex + this.pageSize);
  }

  // Manejar cambio de página
  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

cargarPedidosEnEspera(): void {
  this.isLoading = true;
  this.error = '';

  this.pedidoService.getPedidos().subscribe({
    next: async (pedidos) => {
      try {
        // 🔹 FILTRAR SOLO PEDIDOS PENDIENTES (no usar estado 'D')
        const pedidosFiltrados = pedidos.filter(p => p.Estado_P === 'P');

        // 🔹 ORDENAR POR FECHA Y HORA (más recientes primero)
        const pedidosOrdenados = pedidosFiltrados.sort((a, b) => {
          // Crear objetos Date combinando fecha y hora
          const fechaA = this.crearFechaCompleta(a.Fecha_Registro, a.Hora_Pedido);
          const fechaB = this.crearFechaCompleta(b.Fecha_Registro, b.Hora_Pedido);
          
          // Ordenar descendente (más recientes primero)
          return fechaB.getTime() - fechaA.getTime();
        });

        // Cargar información adicional para cada pedido
        this.pedidos = await this.cargarInformacionCompleta(pedidosOrdenados);
        this.isLoading = false;
        
        // Resetear paginación cuando se cargan nuevos datos
        this.pageIndex = 0;
      } catch (error) {
        this.error = 'Error al cargar la información de los pedidos';
        this.isLoading = false;
        console.error('Error:', error);
      }
    },
    error: (err) => {
      this.error = 'Error al cargar los pedidos';
      this.isLoading = false;
      console.error('Error:', err);
    }
  });
}

// Método auxiliar para crear fecha completa a partir de fecha y hora
private crearFechaCompleta(fecha: string, hora: string): Date {
  try {
    // Si la hora está en formato TIME de SQL Server (HH:MM:SS)
    if (hora && hora.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
      // Combinar fecha y hora
      const fechaHoraString = `${fecha}T${hora}`;
      return new Date(fechaHoraString);
    }
    
    // Si la hora ya está en formato timestamp, usar directamente
    if (hora.includes('T')) {
      return new Date(hora);
    }
    
    // Si solo tenemos fecha, usar inicio del día
    if (fecha) {
      return new Date(fecha);
    }
    
    // Fallback: fecha actual
    return new Date();
  } catch (error) {
    console.warn('Error al parsear fecha:', error);
    return new Date(); // Fallback a fecha actual
  }
}

  private async cargarInformacionCompleta(pedidos: Pedido[]): Promise<any[]> {
    const pedidosCompletos = [];

    for (const pedido of pedidos) {
      try {
        // Cargar información del cliente
        let cliente: Cliente | undefined;
        if (pedido.ID_Cliente && pedido.ID_Cliente !== 1) { // No es cliente genérico
          try {
            cliente = await this.clienteService.getClienteById(pedido.ID_Cliente).toPromise();
          } catch (error) {
            console.warn(`No se pudo cargar cliente ID: ${pedido.ID_Cliente}`);
          }
        }

        // Cargar detalles del pedido
        let detallesCompletos: any[] = [];
        try {
          const detalles = await this.pedidoService.getPedidoDetalles(pedido.ID_Pedido).toPromise();
          detallesCompletos = await this.enriquecerDetalles(detalles || []);
        } catch (error) {
          console.warn(`No se pudieron cargar detalles del pedido ID: ${pedido.ID_Pedido}`);
        }

        pedidosCompletos.push({
          ...pedido,
          cliente,
          detallesCompletos
        });
      } catch (error) {
        console.error(`Error procesando pedido ${pedido.ID_Pedido}:`, error);
      }
    }

    return pedidosCompletos;
  }

  private async enriquecerDetalles(detalles: PedidoDetalle[]): Promise<any[]> {
    const detallesEnriquecidos = [];

    for (const detalle of detalles) {
      try {
        // Obtener información del producto-tamaño
        const productoInfo = await this.obtenerProductoPorTamano(detalle.ID_Producto_T);
        
        detallesEnriquecidos.push({
          ...detalle,
          productoInfo,
          tamanoInfo: this.obtenerNombreTamano(detalle, productoInfo)
        });
      } catch (error) {
        console.warn(`No se pudo cargar producto-tamaño ID: ${detalle.ID_Producto_T}`);
        detallesEnriquecidos.push({
          ...detalle,
          productoInfo: undefined,
          tamanoInfo: detalle.nombre_tamano || 'Tamaño no disponible'
        });
      }
    }

    return detallesEnriquecidos;
  }

  private async obtenerProductoPorTamano(idProductoTamano: number): Promise<Producto | undefined> {
    try {
      const productos = await this.productoService.getProductos().toPromise();
      
      for (const producto of productos || []) {
        const productoTamano = producto.tamanos?.find(t => t.ID_Producto_T === idProductoTamano);
        if (productoTamano) {
          return {
            ...producto,
            tamanos: [productoTamano] // Mantener solo el tamaño relevante
          };
        }
      }
      return undefined;
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return undefined;
    }
  }

  private obtenerNombreTamano(detalle: PedidoDetalle, productoInfo?: Producto): string {
    // Primero intentar usar la información del detalle
    if (detalle.nombre_tamano) {
      return detalle.nombre_tamano;
    }

    // Luego buscar en la información del producto
    if (productoInfo?.tamanos?.[0]?.nombre_tamano) {
      return productoInfo.tamanos[0].nombre_tamano;
    }

    return 'Tamaño único';
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'P': return 'primary'; // Pendiente - Azul
      case 'D': return 'accent';  // En preparación - Naranja
      case 'E': return 'primary'; // Entregado - Verde (pero no debería aparecer)
      case 'C': return 'warn';    // Cancelado - Rojo (pero no debería aparecer)
      default: return 'primary';
    }
  }

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'P': return 'Pendiente';
      case 'D': return 'En preparación';
      case 'E': return 'Entregado';
      case 'C': return 'Cancelado';
      default: return estado;
    }
  }

  getNombreCliente(pedido: any): string {
    if (pedido.cliente) {
      return `${pedido.cliente.Nombre} ${pedido.cliente.Apellido}`;
    }
    return 'Cliente Varios';
  }

getHoraFormateada(hora: string): string {
  if (!hora) return '';
  
  // Si la hora ya está en formato HH:MM:SS, formatearla directamente
  if (hora.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
    const [hours, minutes] = hora.split(':');
    const hourNum = parseInt(hours, 10);
    
    // Formato 12 horas con AM/PM
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    
    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${period}`;
  }
  
  // Si es un timestamp, extraer solo la hora
  try {
    const date = new Date(hora);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch {
    return hora;
  }
}



  async actualizarEstado(pedido: Pedido, nuevoEstado: 'E' | 'C'): Promise<void> {
    // Mostrar SweetAlert2 para cancelar
    if (nuevoEstado === 'C') {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        html: `El pedido <strong>#${pedido.ID_Pedido}</strong> se marcará como <strong>No Entregado</strong>.<br>¿Deseas continuar?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, marcar como No Entregado',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    this.pedidoService.statusPedido(pedido.ID_Pedido, nuevoEstado).subscribe({
      next: (response) => {
        // Mostrar mensaje de éxito
        let mensaje = '';
        let icon: 'success' | 'info' = 'success';
        
        switch (nuevoEstado) {
          case 'E':
            mensaje = `Pedido #${pedido.ID_Pedido} marcado como Entregado`;
            break;
          case 'C':
            mensaje = `Pedido #${pedido.ID_Pedido} marcado como No Entregado`;
            icon = 'info';
            break;
        }

        // Mostrar SweetAlert2 para éxito
        Swal.fire({
          title: '¡Éxito!',
          text: mensaje,
          icon: icon,
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Aceptar'
        });

        // También mostrar snackbar opcional
        this.snackBar.open(mensaje, 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });

        // Remover el pedido de la lista inmediatamente
        this.pedidos = this.pedidos.filter(p => p.ID_Pedido !== pedido.ID_Pedido);
      },
      error: (err) => {
        console.error('Error completo al actualizar estado del pedido:', err);
        
        let mensajeError = 'Error al actualizar el estado del pedido';
        
        // Manejar errores específicos de CORS
        if (err.status === 0) {
          mensajeError = 'Error de conexión con el servidor. Verifica que el backend esté ejecutándose.';
        } else if (err.error && err.error.error) {
          mensajeError = err.error.error;
        }
        
        // Mostrar SweetAlert2 para error
        Swal.fire({
          title: 'Error',
          text: mensajeError,
          icon: 'error',
          confirmButtonColor: '#d33',
          confirmButtonText: 'Aceptar'
        });

        this.snackBar.open(mensajeError, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // También actualizar el método refrescar para recargar correctamente
  refrescar(): void {
    this.cargarPedidosEnEspera();
    this.snackBar.open('Lista actualizada', 'Cerrar', {
      duration: 2000
    });
  }
}