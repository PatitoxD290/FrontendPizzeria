import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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

  // 🔹 Constantes de IDs (BD)
  readonly TIPO_PAGO = { EFECTIVO: 1, BILLETERA: 2, TARJETA: 3 };
  readonly TIPO_VENTA = { BOLETA: 1, FACTURA: 2, NOTA: 3 };
  readonly ORIGEN_VENTA = { KIOSKO: 3 }; // Asumiendo ID 3 para Kiosko

  // Estado del flujo
  total = 0;
  
  // Paso 1: Método de Pago
  selectedMetodoPago: number | null = null;
  montoRecibido: number = 0;
  vuelto: number = 0;
  
  // Paso 2: Comprobante
  pasoActual: 'pago' | 'comprobante' | 'documento' | 'final' = 'pago';
  selectedTipoComprobante: number | null = null;

  // Paso 3: Documento
  tipoDocumento: 'DNI' | 'RUC' | null = null;
  numeroDocumento: string = '';
  
  // Control UI
  recibeString: string = ''; // Para el teclado numérico
  procesando = false;
  codigoPedidoGenerado: string = '';
  clienteData: Cliente | null = null;

  // Verificación Código (Simulado)
  solicitandoCodigo = false;
  codigoVerificacion = '';

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
      // Se mantiene en la vista para ingresar monto
    } else {
      // Tarjeta/Billetera: Simulamos flujo de verificación
      this.montoRecibido = this.total;
      this.vuelto = 0;
      this.solicitandoCodigo = true; // Activa modal de código simulado
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
    this.pasoActual = 'comprobante';
  }

  // Lógica de Verificación (Tarjeta/Yape)
  verificarCodigoSimulado() {
    // Simulamos espera
    this.procesando = true;
    setTimeout(() => {
      this.procesando = false;
      this.solicitandoCodigo = false;
      this.pasoActual = 'comprobante';
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
      // Sin documento -> Cliente Varios (ID 1) directo
      this.procesarVentaFinal(1);
    } else {
      // Boleta/Factura -> Pedir documento
      this.tipoDocumento = (idTipo === this.TIPO_VENTA.FACTURA) ? 'RUC' : 'DNI';
      this.numeroDocumento = '';
      this.pasoActual = 'documento';
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

    // 1. Obtener items del carrito
    const itemsCarrito = this.carritoService.obtenerProductos();
    
    // 2. Generar código único visual
    this.generarCodigoPedido();

    // 3. Mapear detalles (usando DTO)
    const detallesDTO: PedidoDetalleDTO[] = itemsCarrito.map(i => ({
      ID_Producto_T: i.idProductoT || undefined,
      ID_Combo: i.idCombo || undefined,
      Cantidad: i.cantidad,
      PrecioTotal: i.precioTotal
    }));

    // 4. Pedido DTO - ✅ CORREGIDO: ID_Usuario = 1 (Usuario Sistema)
    const pedidoDTO: PedidoCreacionDTO = {
      ID_Cliente: idCliente,
      ID_Usuario: 1, // Usamos 1 para indicar Kiosko/Sistema, ya que el backend espera un número
      Notas: `Kiosko - ${this.codigoPedidoGenerado}`,
      SubTotal: this.total,
      Estado_P: 'P',
      detalles: detallesDTO
    };

    // 5. Crear Pedido
    this.pedidoService.createPedido(pedidoDTO).subscribe({
      next: (resPedido) => {
        const idPedido = resPedido.ID_Pedido;

        // 6. Venta DTO - ✅ CORREGIDO: Eliminado IGV_Porcentaje
        const ventaDTO: VentaCreacionDTO = {
          ID_Pedido: idPedido,
          ID_Tipo_Venta: this.selectedTipoComprobante!,
          ID_Tipo_Pago: this.selectedMetodoPago!,
          ID_Origen_Venta: this.ORIGEN_VENTA.KIOSKO,
          Monto_Recibido: this.montoRecibido
          // IGV_Porcentaje eliminado, el backend lo calcula
        };

        // 7. Crear Venta
        this.ventaService.createVenta(ventaDTO).subscribe({
          next: (resVenta) => {
            this.procesando = false;
            this.pasoActual = 'final';
            
            // Generar PDF
            this.generarPDF(idPedido, resVenta.ID_Venta);
            
            // Limpiar carrito
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
    
    // Cliente
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
    
    // Abrir
    window.open(doc.output('bloburl'), '_blank');
  }

  // Navegación interna
  volverAPago() {
    if (this.selectedMetodoPago === this.TIPO_PAGO.EFECTIVO) {
      this.selectedMetodoPago = null; // Volver a selección
    } else {
      this.selectedMetodoPago = null;
      this.solicitandoCodigo = false;
    }
  }

  volverAComprobante() {
    this.pasoActual = 'comprobante';
    this.numeroDocumento = '';
  }
}