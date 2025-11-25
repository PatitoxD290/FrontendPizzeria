import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
import { PedidoCreacionDTO, PedidoDetalleDTO } from '../../../core/models/pedido.model';
import { VentaCreacionDTO } from '../../../core/models/venta.model';
import { Cliente } from '../../../core/models/cliente.model';

// Utils
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

enum PasoPago {
  PAGO = 'pago',
  COMPROBANTE = 'comprobante',
  DOCUMENTO = 'documento',
  FINAL = 'final'
}

const TIPO_PAGO = { EFECTIVO: 1, BILLETERA: 2, TARJETA: 3 };
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
    DecimalPipe
  ],
  templateUrl: './pago.component.html',
  styleUrls: ['./pago.component.css']
})
export class PagoComponent implements OnInit {
  readonly TIPO_PAGO = TIPO_PAGO;
  readonly TIPO_VENTA = TIPO_VENTA;
  readonly ORIGEN_VENTA = ORIGEN_VENTA;
  readonly Pasos = PasoPago;
  
  total = 0;
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
    this.total = this.carritoService.obtenerTotal();
    if (this.total === 0) {
      this.router.navigate(['/kiosko/menu']);
    }
  }

  // ============ PASO 1: SELECCIÓN DE PAGO ============
  seleccionarMetodo(idMetodo: number) {
    this.selectedMetodoPago = idMetodo;
    
    if (idMetodo === this.TIPO_PAGO.EFECTIVO) {
      this.recibeString = '';
      this.montoRecibido = 0;
      this.vuelto = 0;
    } else {
      this.montoRecibido = this.total;
      this.vuelto = 0;
      this.solicitandoCodigo = true;
    }
  }

  addNumber(num: string) {
    if (this.recibeString === '0') this.recibeString = num;
    else this.recibeString += num;
    this.calcularVuelto();
  }

  addDecimal() {
    if (!this.recibeString.includes('.')) {
      this.recibeString = this.recibeString ? this.recibeString + '.' : '0.';
    }
  }

  deleteLast() {
    this.recibeString = this.recibeString.slice(0, -1);
    this.calcularVuelto();
  }

  clearMonto() {
    this.recibeString = '';
    this.calcularVuelto();
  }

  calcularVuelto() {
    this.montoRecibido = parseFloat(this.recibeString) || 0;
    this.vuelto = Math.max(0, this.montoRecibido - this.total);
  }

  confirmarPagoEfectivo() {
    if (this.montoRecibido < this.total) {
      Swal.fire('Monto insuficiente', `Faltan S/ ${(this.total - this.montoRecibido).toFixed(2)}`, 'warning');
      return;
    }
    this.pasoActual = PasoPago.COMPROBANTE;
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
      this.procesarVentaFinal(1);
    } else {
      this.tipoDocumento = (idTipo === this.TIPO_VENTA.FACTURA) ? 'RUC' : 'DNI';
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
      }
    });
  }

  // ============ PROCESO FINAL ============
  private procesarVentaFinal(idCliente: number) {
    this.procesando = true;
    const itemsCarrito = this.carritoService.obtenerProductos();
    this.generarCodigoPedido();

    const detallesDTO: PedidoDetalleDTO[] = itemsCarrito.map(i => ({
      ID_Producto_T: i.idProductoT || undefined,
      ID_Combo: i.idCombo || undefined,
      Cantidad: i.cantidad,
      PrecioTotal: i.precioTotal
    }));

    const pedidoDTO: PedidoCreacionDTO = {
      ID_Cliente: idCliente,
      ID_Usuario: this.idUsuarioKiosko,
      Notas: `Kiosko - ${this.codigoPedidoGenerado}`,
      SubTotal: this.total,
      Estado_P: 'P',
      detalles: detallesDTO
    };

    this.pedidoService.createPedido(pedidoDTO).subscribe({
      next: (resPedido) => {
        const idPedido = resPedido.ID_Pedido;

        const ventaDTO: VentaCreacionDTO = {
          ID_Pedido: idPedido,
          ID_Tipo_Venta: this.selectedTipoComprobante!,
          ID_Tipo_Pago: this.selectedMetodoPago!,
          ID_Origen_Venta: this.ORIGEN_VENTA.KIOSKO,
          Monto_Recibido: this.montoRecibido
        };

        this.ventaService.createVenta(ventaDTO).subscribe({
          next: (resVenta) => {
            this.procesando = false;
            this.pasoActual = PasoPago.FINAL;
            this.generarPDF(idPedido, resVenta.ID_Venta);
            this.carritoService.vaciarCarrito();
          },
          error: (err) => {
            this.procesando = false;
            console.error('Error venta:', err);
            Swal.fire('Error', 'No se pudo registrar la venta.', 'error');
          }
        });
      },
      error: (err) => {
        this.procesando = false;
        console.error('Error pedido:', err);
        Swal.fire('Error', 'No se pudo crear el pedido.', 'error');
      }
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
      format: [58, 297]
    });

    const fecha = new Date();
    const fechaStr = fecha.toLocaleDateString('es-PE');
    const horaStr = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    
    const pageWidth = 58;
    const marginLeft = 4;
    const marginRight = 4;
    let y = 8;

    doc.setFontSize(11).setFont('helvetica', 'bold');
    doc.text('COMPROBANTE DE PAGO', pageWidth / 2, y, { align: 'center' }); y += 5;
    
    doc.setFontSize(9);
    doc.text('AITA PIZZA S.A.C.', pageWidth / 2, y, { align: 'center' }); y += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.text('RUC: 10713414561', pageWidth / 2, y, { align: 'center' }); y += 4;
    
    doc.setFontSize(7);
    doc.text('Jr. 2 de Mayo - Yarina', pageWidth / 2, y, { align: 'center' }); y += 3;
    doc.text('Pucallpa, Ucayali', pageWidth / 2, y, { align: 'center' }); y += 6;

    doc.setLineWidth(0.2);
    doc.line(marginLeft, y, pageWidth - marginRight, y); y += 4;

    doc.setFontSize(8).setFont('helvetica', 'bold');
    doc.text(`PEDIDO: ${this.codigoPedidoGenerado}`, marginLeft, y); y += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${fechaStr} ${horaStr}`, marginLeft, y); y += 3;
    doc.text(`Canal: Kiosko Autoservicio`, marginLeft, y); y += 6;

    if (this.clienteData) {
      doc.text(`Cliente: ${this.clienteData.Nombre}`, marginLeft, y); y += 3;
      doc.text(`Doc: ${this.numeroDocumento}`, marginLeft, y); y += 6;
    }

    doc.line(marginLeft, y, pageWidth - marginRight, y); y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`TOTAL: S/ ${this.total.toFixed(2)}`, marginLeft, y); y += 5;
    
    doc.setFontSize(8);
    doc.text(`Método: ${this.getMetodoPagoText()}`, marginLeft, y); y += 3;
    doc.text(`Vuelto: S/ ${this.vuelto.toFixed(2)}`, marginLeft, y); y += 8;

    doc.setFontSize(13).setFont('helvetica', 'bold');
    doc.text(`TURNO: ${this.codigoPedidoGenerado}`, pageWidth / 2, y, { align: 'center' }); y += 8;

    doc.setFontSize(7).setFont('helvetica', 'normal');
    doc.text('¡Gracias por tu compra!', pageWidth / 2, y, { align: 'center' }); y += 4;
    doc.text('@AITA.PIZZA', pageWidth / 2, y, { align: 'center' });

    window.open(doc.output('bloburl'), '_blank');
  }

  getMetodoPagoText(): string {
    switch(this.selectedMetodoPago) {
      case TIPO_PAGO.EFECTIVO: return 'Efectivo';
      case TIPO_PAGO.TARJETA: return 'Tarjeta';
      case TIPO_PAGO.BILLETERA: return 'Yape/Plin';
      default: return 'Efectivo';
    }
  }

  // ============ NAVEGACIÓN ============
  volverInicio() {
    this.router.navigate(['/']);
  }

  volverAPago() {
    if (this.selectedMetodoPago === this.TIPO_PAGO.EFECTIVO) {
      this.selectedMetodoPago = null;
    } else {
      this.selectedMetodoPago = null;
      this.solicitandoCodigo = false;
    }
  }

  volverAComprobante() {
    this.pasoActual = PasoPago.COMPROBANTE;
    this.numeroDocumento = '';
  }
}