import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import Swal from 'sweetalert2';

// Servicios y modelos
import { VentaService } from '../../../../core/services/venta.service';
import { OrdenService } from '../../../../core/services/orden.service';
import { PedidoDetalle, PedidoConDetalle } from '../../../../core/models/pedido.model';
import { PedidoService } from '../../../../core/services/pedido.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { TamanoService } from '../../../../core/services/tamano.service';
import { Tamano } from '../../../../core/models/tamano.model';

import { MatDialog } from '@angular/material/dialog';
import { VentaPedidoComponent } from '../venta-pedido/venta-pedido.component';

@Component({
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './detalle-pedido.component.html',
  styleUrls: ['./detalle-pedido.component.css'],
})
export class DetallePedidoComponent implements OnInit {
  detalles: PedidoDetalle[] = [];
  tamanos: Tamano[] = [];
  displayedColumns = ['producto', 'tamano', 'cantidad', 'precio', 'subtotal', 'acciones'];
  
  tipoDocumento: 'DNI' | 'RUC' = 'DNI';
  numeroDocumento: string = '';
  codigoPedido: string = '';

  constructor(
    private ordenService: OrdenService,
    private pedidoService: PedidoService,
    private authService: AuthService,
    private clienteService: ClienteService,
    private tamanoService: TamanoService,
    private dialog: MatDialog, 
    private ventaService: VentaService 
  ) {}

  ngOnInit(): void {
    this.tamanoService.getTamanos().subscribe({
      next: (data) => {
        this.tamanos = data;
        // Suscribirse a los detalles del servicio
        this.ordenService.detalles$.subscribe((detalles) => {
          this.detalles = detalles;
        });
      },
      error: (err) => console.error('Error al cargar tamaños:', err),
    });

    this.generarCodigoPedido();
  }

  soloNumeros(event: any) {
    this.numeroDocumento = event.target.value.replace(/[^0-9]/g, '');
  }

  getNombreTamano(detalle: PedidoDetalle): string {
    return detalle.nombre_tamano || '—';
  }

  aumentarCantidad(detalle: PedidoDetalle) {
    const precioUnitario = detalle.PrecioTotal / detalle.Cantidad;
    this.ordenService.aumentarCantidad(detalle.ID_Producto_T, precioUnitario);
  }

  reducirCantidad(detalle: PedidoDetalle) {
    if (detalle.Cantidad > 1) {
      const precioUnitario = detalle.PrecioTotal / detalle.Cantidad;
      this.ordenService.reducirCantidad(detalle.ID_Producto_T, precioUnitario);
    }
  }

  eliminar(detalle: PedidoDetalle) {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: `Se eliminará ${detalle.nombre_producto} (${detalle.nombre_tamano}).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    }).then(result => {
      if (result.isConfirmed) {
        this.ordenService.eliminarProducto(detalle.ID_Producto_T);
        Swal.fire({
          title: 'Eliminado',
          text: 'El producto fue eliminado del pedido.',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true
        });
      }
    });
  }

  getTotal(): number {
    return this.detalles.reduce((acc, d) => acc + (d.PrecioTotal || 0), 0);
  }

  generarCodigoPedido() {
    const numeros = '0123456789';
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let codigo = '';
    for (let i = 0; i < 2; i++) codigo += numeros.charAt(Math.floor(Math.random() * numeros.length));
    for (let i = 0; i < 2; i++) codigo += letras.charAt(Math.floor(Math.random() * letras.length));
    this.codigoPedido = codigo;
  }

  realizarPedido() {
    if (this.detalles.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Carrito vacío', text: 'Agrega productos antes de realizar el pedido.' });
      return;
    }

    const usuarioLogueado = this.authService.getUser();
    const idUsuario = usuarioLogueado?.ID_Usuario ?? 1;

    const doc = this.numeroDocumento.trim();

    if (doc) {
      this.validarClienteYContinuar(doc, idUsuario);
    } else {
      this.abrirModalPago(idUsuario, 1); // Cliente genérico
    }
  }

  private validarClienteYContinuar(doc: string, idUsuario: number) {
    if (!/^\d+$/.test(doc)) {
      Swal.fire({ icon: 'error', title: 'Documento inválido', text: 'Solo números.' });
      return;
    }

    if ((this.tipoDocumento === 'DNI' && doc.length !== 8) ||
        (this.tipoDocumento === 'RUC' && doc.length !== 11)) {
      Swal.fire({ icon: 'error', title: 'Longitud incorrecta', text: 'Longitud inválida.' });
      return;
    }

    this.clienteService.buscarClientePorDocumento(doc).subscribe({
      next: (res) => {
        const idCliente = res.cliente?.ID_Cliente ?? 1;
        this.abrirModalPago(idUsuario, idCliente);
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'No encontrado', text: 'Cliente no existe.' });
      }
    });
  }

  private abrirModalPago(idUsuario: number, idCliente: number) {
    const dialogRef = this.dialog.open(VentaPedidoComponent, {
      width: '500px', // 🔹 Aumentado un poco para mejor visualización
      data: { total: this.getTotal() }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      // Convertir método a la sigla correcta
      const metodoPagoMap: any = {
        'EFECTIVO': 'E',
        'TARJETA': 'T',
        'BILLETERA': 'B'
      };

      const metodoPagoConvertido = metodoPagoMap[result.metodoPago];

      // 🔹 Obtener el texto del método de pago para las notas
      const metodoPagoTexto = this.obtenerTextoMetodoPago(result.metodoPago);

      // 🔹 MODIFICADO: Pasar montoRecibido desde el modal
      this.enviarPedido(
        idUsuario, 
        idCliente, 
        metodoPagoConvertido, 
        result.recibe, 
        result.vuelto,
        metodoPagoTexto,
        result.montoRecibido // 🔹 NUEVO: Pasar monto recibido
      );
    });
  }

  // 🔹 Método para obtener el texto del método de pago
  private obtenerTextoMetodoPago(metodoPago: string): string {
    const metodosTexto: any = {
      'EFECTIVO': 'EFECTIVO',
      'TARJETA': 'TARJETA', 
      'BILLETERA': 'BILLETERA'
    };
    return metodosTexto[metodoPago] || 'EFECTIVO';
  }

  // 🔹 MODIFICADO: Ahora recibe montoRecibido para la venta
  private enviarPedido(
    idUsuario: number, 
    idCliente: number, 
    metodoPago: 'E' | 'T' | 'B', 
    recibe: number, 
    vuelto: number,
    metodoPagoTexto: string,
    montoRecibido: number // 🔹 NUEVO: Monto recibido para la venta
  ) {
    
    // Crear detalles del pedido
    const detallesPedido: PedidoDetalle[] = this.detalles.map((d) => ({
      ID_Pedido_D: 0,
      ID_Pedido: 0,
      ID_Producto_T: d.ID_Producto_T,
      Cantidad: d.Cantidad,
      PrecioTotal: d.PrecioTotal,
      nombre_producto: d.nombre_producto,
      nombre_categoria: d.nombre_categoria,
      nombre_tamano: d.nombre_tamano
    }));

    // 🔹 MODIFICADO: Crear el texto para el campo Notas incluyendo montos si es efectivo
    let textoNotas = `Pedido ${this.codigoPedido} - ${metodoPagoTexto} - Caja`;
    if (metodoPago === 'E' && recibe > 0) {
      textoNotas += ` - Recibe: S/${recibe} - Vuelto: S/${vuelto}`;
    }

    // Crear PedidoConDetalle con todos los campos requeridos
    const pedidoData: PedidoConDetalle = {
      ID_Pedido: 0, // El backend lo generará
      ID_Cliente: idCliente,
      ID_Usuario: idUsuario,
      Notas: textoNotas, // 🔹 Usar el nuevo formato con montos
      SubTotal: this.getTotal(),
      Estado_P: 'P', // P = Pendiente
      Fecha_Registro: new Date().toISOString().split('T')[0],
      Hora_Pedido: new Date().toTimeString().split(' ')[0],
      detalles: detallesPedido
    };

    // Enviar pedido usando PedidoConDetalle
    this.pedidoService.createPedido(pedidoData).subscribe({
      next: (res) => {
        const idPedidoCreado = res.ID_Pedido;

        // 🔹 MODIFICADO: Registrar Venta con Monto_Recibido
        this.ventaService.createVenta({
          ID_Pedido: idPedidoCreado,
          Tipo_Venta: (() => {
            if (!this.numeroDocumento.trim()) return 'N'; // Sin documento → Nota
            if (this.tipoDocumento === 'DNI') return 'B'; // DNI → Boleta
            if (this.tipoDocumento === 'RUC') return 'F'; // RUC → Factura
            return 'N';
          })(),
          Metodo_Pago: metodoPago,
          Lugar_Emision: 'A',
          IGV_Porcentaje: 18,
          Monto_Recibido: montoRecibido // 🔹 NUEVO: Incluir monto recibido
        }).subscribe({
          next: (ventaResponse) => {
            let mensaje = `Pedido ${this.codigoPedido} registrado correctamente. Método: ${metodoPagoTexto}`;
            
            // 🔹 NUEVO: Mostrar información de montos si es efectivo
            if (metodoPago === 'E') {
              mensaje += `\nRecibido: S/${recibe} - Vuelto: S/${vuelto}`;
            }

            Swal.fire({ 
              icon: 'success', 
              title: 'Venta Registrada', 
              text: mensaje,
              confirmButtonText: 'Aceptar'
            });

            this.ordenService.limpiar();
            this.numeroDocumento = '';
            this.generarCodigoPedido();
          },
          error: (err) => {
            console.error('Error al crear venta:', err);
            Swal.fire({ 
              icon: 'error', 
              title: 'Error en venta', 
              text: 'El pedido se creó pero hubo un problema al registrar la venta.' 
            });
          }
        });
      },
      error: (err) => {
        console.error('Error al crear pedido:', err);
        Swal.fire({ 
          icon: 'error', 
          title: 'Error', 
          text: 'Ocurrió un problema al crear el pedido.' 
        });
      },
    });
  }
}