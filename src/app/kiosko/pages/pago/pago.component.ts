import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // 🟢 AGREGAR RouterModule

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Servicios
import { CarritoService } from '../../../core/services/carrito.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { VentaService } from '../../../core/services/venta.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { AuthService } from '../../../core/services/auth/auth.service';



// Modelos
import {
  PedidoCreacionDTO,
  PedidoDetalleDTO,
  DatosPedido,
} from '../../../core/models/pedido.model';
import { VentaCreacionDTO } from '../../../core/models/venta.model';
import { Cliente } from '../../../core/models/cliente.model';

// Utils
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

enum PasoPago {
  PAGO = 'pago',
  COMPROBANTE = 'comprobante',
  DOCUMENTO = 'documento',
  FINAL = 'final',
}

const TIPO_PAGO = { BILLETERA: 2, TARJETA: 3 };
const TIPO_VENTA = { BOLETA: 1, FACTURA: 2, NOTA: 3 };
const ORIGEN_VENTA = { KIOSKO: 3 };
const ID_USUARIO_SISTEMA = 1;

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DecimalPipe,
    RouterModule, // 🟢 AGREGAR RouterModule aquí
  ],
  templateUrl: './pago.component.html',
  styleUrls: ['./pago.component.css'],
})
export class PagoComponent implements OnInit {
  readonly TIPO_PAGO = TIPO_PAGO;
  readonly TIPO_VENTA = TIPO_VENTA;
  readonly ORIGEN_VENTA = ORIGEN_VENTA;
  readonly Pasos = PasoPago;

  total = 0;
  subtotal = 0;
  selectedMetodoPago: number | null = null;
  montoRecibido: number = 0;
  vuelto: number = 0;
  pasoActual: PasoPago = PasoPago.PAGO;
  selectedTipoComprobante: number | null = null;
  tipoDocumento: 'DNI' | 'RUC' | null = null;
  numeroDocumento: string = '';
  recibeString: string = '';
  procesando = false;
  codigoPedidoGenerado: string = '';
  clienteData: Cliente | null = null;
  solicitandoCodigo = false;
  codigoVerificacion = '';

  private idUsuarioKiosko: number = ID_USUARIO_SISTEMA;

  constructor(
    private carritoService: CarritoService,
    private router: Router,
    private pedidoService: PedidoService,
    private ventaService: VentaService,
    private clienteService: ClienteService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.calcularTotales();
    if (this.total === 0) {
      this.router.navigate(['/kiosko/menu']);
    }
  }

  private calcularTotales() {
    const items = this.carritoService.obtenerProductos();
    this.subtotal = items.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);
    this.total = this.subtotal;
  }

  // ============ PASO 1: SELECCIÓN DE PAGO ============
  seleccionarMetodo(idMetodo: number) {
    this.selectedMetodoPago = idMetodo;
    this.montoRecibido = this.total;
    this.vuelto = 0;
    this.solicitandoCodigo = true;
  }

  verificarCodigoSimulado() {
    this.procesando = true;
    setTimeout(() => {
      this.procesando = false;
      this.solicitandoCodigo = false;
      this.pasoActual = PasoPago.COMPROBANTE;
    }, 1500);
  }

  cancelarVerificacion() {
    this.solicitandoCodigo = false;
    this.selectedMetodoPago = null;
  }

  // ============ PASO 2: COMPROBANTE ============
  seleccionarComprobante(idTipo: number) {
    this.selectedTipoComprobante = idTipo;

    if (idTipo === this.TIPO_VENTA.NOTA) {
      this.procesarVentaFinal(1); // Cliente Varios
    } else {
      this.tipoDocumento = idTipo === this.TIPO_VENTA.FACTURA ? 'RUC' : 'DNI';
      this.numeroDocumento = '';
      this.pasoActual = PasoPago.DOCUMENTO;
    }
  }

  // ============ PASO 3: DOCUMENTO ============
  addDocNumber(num: string) {
    const maxLen = this.tipoDocumento === 'DNI' ? 8 : 11;
    if (this.numeroDocumento.length < maxLen) {
      this.numeroDocumento += num;
    }
  }

  deleteDocLast() {
    this.numeroDocumento = this.numeroDocumento.slice(0, -1);
  }

  clearDoc() {
    this.numeroDocumento = '';
  }

  confirmarDocumento() {
    const len = this.numeroDocumento.length;
    const req = this.tipoDocumento === 'DNI' ? 8 : 11;

    if (len !== req) {
      Swal.fire('Error', `El ${this.tipoDocumento} debe tener ${req} dígitos.`, 'error');
      return;
    }

    this.procesando = true;

    this.clienteService.buscarClientePorDocumento(this.numeroDocumento).subscribe({
      next: (res) => {
        const cliente = res.cliente || res;
        this.clienteData = cliente;
        this.procesarVentaFinal(cliente.ID_Cliente);
      },
      error: (err) => {
        console.error(err);
        this.procesando = false;
        Swal.fire('Error', 'No se pudo validar el documento. Intente nuevamente.', 'error');
      },
    });
  }

  // ============ PROCESO FINAL ============
  private procesarVentaFinal(idCliente: number) {
    this.procesando = true;
    const itemsCarrito = this.carritoService.obtenerProductos();
    this.generarCodigoPedido();

    const detallesDTO: PedidoDetalleDTO[] = itemsCarrito.map((item) => ({
      ID_Producto_T: item.esCombo ? null : item.idProductoT || null,
      ID_Combo: item.esCombo ? item.idCombo || null : null,
      Cantidad: item.cantidad,
      PrecioTotal: item.precioTotal,
      Complementos: [],
      Precio: item.precioUnitario
    }));

    const pedidoDTO: PedidoCreacionDTO = {
      ID_Cliente: idCliente,
      ID_Usuario: this.idUsuarioKiosko,
      Hora_Pedido: new Date().toLocaleTimeString('es-PE', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      Estado_P: 'P',
      Notas: `Kiosko - ${this.codigoPedidoGenerado}`,
      SubTotal: this.subtotal,
      detalles: detallesDTO,
    };

    console.log('Enviando pedido:', pedidoDTO);

    this.pedidoService.createPedido(pedidoDTO).subscribe({
      next: (resPedido: any) => {
        const idPedido = resPedido.ID_Pedido;

        const ventaDTO: VentaCreacionDTO = {
          ID_Pedido: idPedido,
          ID_Tipo_Venta: this.selectedTipoComprobante!,
          ID_Tipo_Pago: this.selectedMetodoPago!,
          ID_Origen_Venta: this.ORIGEN_VENTA.KIOSKO,
          Monto_Recibido: this.montoRecibido,
        };

        console.log('Enviando venta:', ventaDTO);

        this.ventaService.createVenta(ventaDTO).subscribe({
          next: (resVenta: any) => {
            this.procesando = false;
            this.pasoActual = PasoPago.FINAL;
            this.generarPDF(idPedido, resVenta.ID_Venta);
            this.carritoService.vaciarCarrito();

            Swal.fire({
              title: '¡Éxito!',
              text: 'Pedido y venta registrados correctamente',
              icon: 'success',
              confirmButtonText: 'Aceptar',
            });
          },
          error: (err) => {
            this.procesando = false;
            console.error('Error al crear venta:', err);
            Swal.fire('Error', 'No se pudo registrar la venta.', 'error');
          },
        });
      },
      error: (err) => {
        this.procesando = false;
        console.error('Error al crear pedido:', err);
        Swal.fire('Error', 'No se pudo crear el pedido.', 'error');
      },
    });
  }

  generarCodigoPedido() {
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.codigoPedidoGenerado = `K-${rand}`;
  }

  // ============ GENERACIÓN PDF ============
  generarPDF(idPedido: number, idVenta: number) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [58, 297],
    });

    const fecha = new Date();
    const fechaStr = fecha.toLocaleDateString('es-PE');
    const horaStr = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    const pageWidth = 58;
    const marginLeft = 4;
    const marginRight = 4;
    let y = 8;

    doc.setFontSize(11).setFont('helvetica', 'bold');
    doc.text('COMPROBANTE DE PAGO', pageWidth / 2, y, { align: 'center' });
    y += 5;

    doc.setFontSize(9);
    doc.text('AITA PIZZA S.A.C.', pageWidth / 2, y, { align: 'center' });
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.text('RUC: 10713414561', pageWidth / 2, y, { align: 'center' });
    y += 4;

    doc.setFontSize(7);
    doc.text('Jr. 2 de Mayo - Yarina', pageWidth / 2, y, { align: 'center' });
    y += 3;
    doc.text('Pucallpa, Ucayali', pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setLineWidth(0.2);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 4;

    doc.setFontSize(8).setFont('helvetica', 'bold');
    doc.text(`PEDIDO: ${this.codigoPedidoGenerado}`, marginLeft, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${fechaStr} ${horaStr}`, marginLeft, y);
    y += 3;
    doc.text(`Canal: Kiosko Autoservicio`, marginLeft, y);
    y += 6;

    if (this.clienteData) {
      doc.text(`Cliente: ${this.clienteData.Nombre}`, marginLeft, y);
      y += 3;
      doc.text(`Doc: ${this.numeroDocumento}`, marginLeft, y);
      y += 6;
    }

    const items = this.carritoService.obtenerProductos();
    doc.text('ITEMS:', marginLeft, y);
    y += 3;

    items.forEach((item) => {
      const itemText = `${item.cantidad}x ${item.nombre}`;
      const precioText = `S/ ${(item.precioUnitario * item.cantidad).toFixed(2)}`;

      const maxWidth = pageWidth - marginLeft - marginRight - 15;
      let truncatedName = item.nombre;
      if (doc.getTextWidth(itemText) > maxWidth) {
        truncatedName = item.nombre.substring(0, 20) + '...';
      }

      doc.text(`${item.cantidad}x ${truncatedName}`, marginLeft, y);
      doc.text(precioText, pageWidth - marginRight, y, { align: 'right' });
      y += 3;
    });

    y += 3;
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 4;

    doc.setFontSize(8);
    doc.text(`SubTotal: S/ ${this.subtotal.toFixed(2)}`, marginLeft, y);
    y += 3;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`TOTAL: S/ ${this.total.toFixed(2)}`, marginLeft, y);
    y += 5;

    doc.setFontSize(8);
    doc.text(`Método: ${this.getMetodoPagoText()}`, marginLeft, y);
    y += 3;
    
    y += 5;

    doc.setFontSize(13).setFont('helvetica', 'bold');
    doc.text(`TURNO: ${this.codigoPedidoGenerado}`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(7).setFont('helvetica', 'normal');
    doc.text('¡Gracias por tu compra!', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text('@AITA.PIZZA', pageWidth / 2, y, { align: 'center' });

    window.open(doc.output('bloburl'), '_blank');
  }

  getMetodoPagoText(): string {
    switch (this.selectedMetodoPago) {
      case TIPO_PAGO.TARJETA:
        return 'Tarjeta';
      case TIPO_PAGO.BILLETERA:
        return 'Yape/Plin';
      default:
        return 'Digital';
    }
  }




  // ============ NAVEGACIÓN ============
  volverInicio() {
  this.router.navigate(['/']);
}

volverAPago() {
  Swal.fire({
    title: '¿Cancelar compra?',
    text: 'Si regresas al pago, se perderá el progreso actual de tu pedido',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e51d1d',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, cancelar',
    cancelButtonText: 'Seguir comprando',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      // Si confirma la cancelación, regresar al paso de pago
      this.selectedMetodoPago = null;
      this.solicitandoCodigo = false;
      this.pasoActual = PasoPago.PAGO;
      
      Swal.fire({
        title: 'Compra cancelada',
        text: 'Has regresado a la sección de pago',
        icon: 'info',
        confirmButtonColor: '#e51d1d',
        confirmButtonText: 'Aceptar'
      });
    }
  });
}

volverAComprobante() {
  Swal.fire({
    title: '¿Volver atrás?',
    text: 'Se perderá la información del documento ingresado',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#e51d1d',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, volver',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      this.pasoActual = PasoPago.COMPROBANTE;
      this.numeroDocumento = '';
    }
  });
}

// 🟢 NUEVO MÉTODO: Volver al carrito con validación
volverAlCarrito() {
  Swal.fire({
    title: '¿Volver al carrito?',
    text: 'Podrás modificar los productos de tu pedido',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#e51d1d',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, volver',
    cancelButtonText: 'Seguir en pago',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      this.router.navigate(['/kiosko/carrito']);
    }
  });
}
}