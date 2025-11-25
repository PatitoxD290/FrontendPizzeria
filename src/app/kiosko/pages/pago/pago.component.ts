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

// Modelos (DTOs)
import { PedidoCreacionDTO, PedidoDetalleDTO } from '../../../core/models/pedido.model';
import { VentaCreacionDTO } from '../../../core/models/venta.model';
import { Cliente } from '../../../core/models/cliente.model';

// Utils
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 

// ===========================================
// ENUMS Y CONSTANTES (Globales para el módulo)
// ===========================================

// Definición de pasos para mejorar legibilidad
enum PasoPago {
  PAGO = 'pago',
  COMPROBANTE = 'comprobante',
  DOCUMENTO = 'documento',
  FINAL = 'final'
}

const TIPO_PAGO_CONST = { EFECTIVO: 1, BILLETERA: 2, TARJETA: 3 };
const TIPO_VENTA_CONST = { BOLETA: 1, FACTURA: 2, NOTA: 3 };
const ORIGEN_VENTA_CONST = { KIOSKO: 3 }; 
const ID_USUARIO_SISTEMA = 1; // ID 1 para Kiosko/Sistema

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
  templateUrl: './pago.component.html', // Usando archivo externo
  styleUrls: ['./pago.component.css']
})
export class PagoComponent implements OnInit {

  // 🔹 Constantes y Enum expuestos al Template
  readonly TIPO_PAGO = TIPO_PAGO_CONST;
  readonly TIPO_VENTA = TIPO_VENTA_CONST;
  readonly ORIGEN_VENTA = ORIGEN_VENTA_CONST;
  readonly Pasos = PasoPago; // Exponemos el Enum para el HTML
  
  // Estado del flujo
  total = 0;
  
  // Paso 1: Pago
  selectedMetodoPago: number | null = null;
  montoRecibido: number = 0;
  vuelto: number = 0;
  
  // Paso 2: Comprobante
  pasoActual: PasoPago = PasoPago.PAGO;
  selectedTipoComprobante: number | null = null;

  // Paso 3: Documento
  tipoDocumento: 'DNI' | 'RUC' | null = null;
  numeroDocumento: string = '';
  
  // Control UI
  recibeString: string = ''; 
  procesando = false;
  codigoPedidoGenerado: string = '';
  clienteData: Cliente | null = null;

  // Verificación Código (Simulado)
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

  // ============================================================
  // 1️⃣ PASO 1: SELECCIÓN DE PAGO
  // ============================================================

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

  // Lógica del Teclado Numérico (Efectivo)
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

  // Lógica de Verificación (Tarjeta/Yape)
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

  // ============================================================
  // 2️⃣ PASO 2: SELECCIÓN DE COMPROBANTE
  // ============================================================

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

  // ============================================================
  // 3️⃣ PASO 3: DOCUMENTO CLIENTE
  // ============================================================

  // Teclado para DNI/RUC
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
    
    // Buscar/Crear Cliente
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

  // ============================================================
  // 🚀 PROCESO FINAL: REGISTRO EN BD
  // ============================================================

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

  volverInicio() {
    this.router.navigate(['/']);
  }

  // ============================================================
  // 📄 GENERACIÓN DE PDF (Simplificada)
  // ============================================================
  
  generarPDF(idPedido: number, idVenta: number) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200]
    });

    const fecha = new Date().toLocaleString();
    let y = 10;

    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text('COMPROBANTE DE PAGO', 40, y, { align: 'center' }); y += 5;
    doc.setFontSize(8);
    doc.text('AITA PIZZA - KIOSKO', 40, y, { align: 'center' }); y += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Venta: #${idVenta}`, 5, y); y += 4;
    doc.text(`Fecha: ${fecha}`, 5, y); y += 4;
    doc.text(`Pedido: ${this.codigoPedidoGenerado}`, 5, y); y += 6;
    
    if (this.clienteData) {
      doc.text(`Cliente: ${this.clienteData.Nombre}`, 5, y); y += 4;
      doc.text(`Doc: ${this.numeroDocumento}`, 5, y); y += 6;
    }

    doc.line(5, y, 75, y); y += 4;

    doc.text('Detalle enviado a cocina.', 5, y); y += 6;
    
    doc.line(5, y, 75, y); y += 4;

    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: S/ ${this.total.toFixed(2)}`, 75, y, { align: 'right' }); y += 10;

    doc.setFontSize(12);
    doc.text(`TURNO: ${this.codigoPedidoGenerado}`, 40, y, { align: 'center' });
    
    window.open(doc.output('bloburl'), '_blank');
  }

  // Navegación interna (usando el Enum)
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