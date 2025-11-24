import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import Swal from 'sweetalert2';
import { VentaService } from '../../../../core/services/venta.service';
import { PedidoService } from '../../../../core/services/pedido.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { PedidoDetalle, PedidoCreacionDTO } from '../../../../core/models/pedido.model';
import { VentaCreacionDTO } from '../../../../core/models/venta.model';
import { Cliente } from '../../../../core/models/cliente.model';

// PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-venta-pedido',
  standalone: true,
  imports: [
    CommonModule,  
    FormsModule,
    DecimalPipe,   
    MatDialogModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './venta-pedido.component.html',
  styleUrl: './venta-pedido.component.css'
})
export class VentaPedidoComponent implements OnInit {

  // 🔹 Constantes de IDs (Según tu BD)
  readonly TIPO_PAGO = { EFECTIVO: 1, BILLETERA: 2, TARJETA: 3 };
  readonly TIPO_VENTA = { BOLETA: 1, FACTURA: 2, NOTA: 3 };
  readonly ORIGEN_VENTA = { MOSTRADOR: 1 };

  // 🔹 Paso 1: Método de pago
  selectedMetodoPago: number = this.TIPO_PAGO.EFECTIVO;
  recibe: string = '';
  vuelto: number = 0;

  // 🔹 Paso 2: Tipo de comprobante
  pasoActual: 'pago' | 'comprobante' | 'documento' = 'pago';
  selectedTipoComprobante: number | null = null;

  // 🔹 Paso 3: Datos del documento
  tipoDocumento: 'DNI' | 'RUC' = 'DNI';
  numeroDocumento: string = '';

  // 🔹 Estado
  cargando: boolean = false;
  clienteData: Cliente | null = null;

  constructor(
    public dialogRef: MatDialogRef<VentaPedidoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      total: number, 
      codigoPedido: string, 
      idUsuario: number,
      detalles: PedidoDetalle[]
    },
    private pedidoService: PedidoService,
    private ventaService: VentaService,
    private clienteService: ClienteService
  ) {}

  ngOnInit(): void {}

  // ============================================================
  // 1️⃣ LÓGICA DE PAGO (CALCULADORA)
  // ============================================================

  calcularVuelto() {
    const recibeNum = parseFloat(this.recibe) || 0;
    this.vuelto = Math.max(0, recibeNum - this.data.total);
  }

  onRecibeChange() {
    this.calcularVuelto();
  }

  addNumber(num: string) {
    if (this.recibe === '0' || this.recibe === '') {
      this.recibe = num;
    } else {
      this.recibe += num;
    }
    this.calcularVuelto();
  }

  deleteLast() {
    if (this.recibe.length > 1) {
      this.recibe = this.recibe.slice(0, -1);
    } else {
      this.recibe = '';
    }
    this.calcularVuelto();
  }

  clearRecibe() {
    this.recibe = '';
    this.vuelto = 0;
  }

  addDecimal() {
    if (!this.recibe.includes('.')) {
      this.recibe = this.recibe ? this.recibe + '.' : '0.';
    }
  }

  setMontoExacto() {
    this.recibe = this.data.total.toString();
    this.calcularVuelto();
  }

  validarPago(): boolean {
    if (this.selectedMetodoPago === this.TIPO_PAGO.EFECTIVO) {
      const recibeNum = parseFloat(this.recibe) || 0;
      
      if (!this.recibe) {
        Swal.fire({
          icon: 'warning',
          title: 'Monto requerido',
          text: 'Por favor ingrese el monto recibido.',
          confirmButtonColor: '#d33'
        });
        return false;
      }
      
      if (recibeNum < this.data.total) {
        Swal.fire({
          icon: 'warning',
          title: 'Monto insuficiente',
          text: `El monto recibido es menor al total a pagar. Faltan S/ ${(this.data.total - recibeNum).toFixed(2)}`,
          confirmButtonColor: '#d33'
        });
        return false;
      }
    } else {
      // Para tarjeta/billetera asumimos pago exacto
      this.recibe = this.data.total.toString();
      this.vuelto = 0;
    }
    return true;
  }

  confirmarPago() {
    if (this.validarPago()) {
      this.pasoActual = 'comprobante';
    }
  }

  // ============================================================
  // 2️⃣ SELECCIÓN DE COMPROBANTE
  // ============================================================

  seleccionarComprobante(tipoId: number) {
    this.selectedTipoComprobante = tipoId;

    if (tipoId === this.TIPO_VENTA.NOTA) {
      // Nota de Venta -> Cliente "Varios" (ID 1) directo
      this.registrarVentaCompleta(1);
    } else {
      // Boleta o Factura -> Pedir Documento
      this.pasoActual = 'documento';
      this.tipoDocumento = (tipoId === this.TIPO_VENTA.FACTURA) ? 'RUC' : 'DNI';
      this.numeroDocumento = '';
    }
  }

  // ============================================================
  // 3️⃣ DATOS DEL CLIENTE
  // ============================================================

  soloNumeros(event: any) {
    this.numeroDocumento = event.target.value.replace(/[^0-9]/g, '');
  }

  validarDocumento(): boolean {
    const doc = this.numeroDocumento.trim();
    
    if (!doc) {
      Swal.fire({
        icon: 'warning',
        title: 'Documento requerido',
        text: `Para ${this.getTipoComprobanteText()} debe ingresar ${this.tipoDocumento}.`,
        confirmButtonColor: '#d33'
      });
      return false;
    }

    if (!/^\d+$/.test(doc)) {
      Swal.fire({
        icon: 'error',
        title: 'Documento inválido',
        text: 'Solo se permiten números.',
        confirmButtonColor: '#d33'
      });
      return false;
    }

    const largoRequerido = this.tipoDocumento === 'DNI' ? 8 : 11;
    if (doc.length !== largoRequerido) {
      Swal.fire({
        icon: 'error',
        title: 'Longitud incorrecta',
        text: `${this.tipoDocumento} debe tener ${largoRequerido} dígitos.`,
        confirmButtonColor: '#d33'
      });
      return false;
    }

    return true;
  }

  confirmarDocumento() {
    if (!this.validarDocumento()) return;

    this.cargando = true;

    this.clienteService.buscarClientePorDocumento(this.numeroDocumento).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.cliente && res.cliente.ID_Cliente) {
          this.clienteData = res.cliente;
          this.registrarVentaCompleta(res.cliente.ID_Cliente);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID del cliente. Intente nuevamente.',
            confirmButtonColor: '#d33'
          });
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al buscar/crear cliente:', err);
        
        let mensajeError = 'Error al procesar el documento';
        if (err.error?.error) {
          mensajeError = err.error.error;
        } else if (err.status === 404) {
          mensajeError = 'Documento no encontrado en registros públicos';
        }

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: mensajeError,
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  // ============================================================
  // 🚀 PROCESO FINAL: CREAR PEDIDO Y VENTA
  // ============================================================

  private registrarVentaCompleta(idCliente: number) {
    this.cargando = true;

    // 1. Preparar Detalles para el Backend
    const detallesDTO = this.data.detalles.map(d => ({
      ID_Producto_T: d.ID_Producto_T || null,
      ID_Combo: d.ID_Combo || null,
      Cantidad: d.Cantidad,
      PrecioTotal: d.PrecioTotal
    }));

    // 2. Crear Objeto Pedido DTO
    const pedidoDTO: PedidoCreacionDTO = {
      ID_Cliente: idCliente,
      ID_Usuario: this.data.idUsuario,
      Notas: this.generarNotas(),
      SubTotal: this.data.total,
      detalles: detallesDTO
    };

    // 3. Llamar al servicio de Pedidos
    this.pedidoService.createPedido(pedidoDTO).subscribe({
      next: (resPedido) => {
        const idPedidoCreado = resPedido.ID_Pedido;

        // 4. Crear Objeto Venta DTO
        const ventaDTO: VentaCreacionDTO = {
          ID_Pedido: idPedidoCreado,
          ID_Tipo_Venta: this.selectedTipoComprobante!,
          ID_Tipo_Pago: this.selectedMetodoPago,
          ID_Origen_Venta: this.ORIGEN_VENTA.MOSTRADOR,
          Monto_Recibido: parseFloat(this.recibe) || this.data.total
        };

        // 5. Llamar al servicio de Ventas
        this.ventaService.createVenta(ventaDTO).subscribe({
          next: (resVenta) => {
            this.cargando = false;
            
            // 🔹 Generar comprobante PDF
            this.generarComprobantePDF(resVenta.ID_Venta, idPedidoCreado);
            
            // 🔹 Mostrar mensaje de éxito
            this.mostrarMensajeExito(resVenta.Puntos_Ganados, idPedidoCreado, resVenta.ID_Venta);
            
            // 🔹 Cerrar modal indicando éxito
            this.dialogRef.close({ registrado: true });
          },
          error: (err) => {
            this.cargando = false;
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
        this.cargando = false;
        console.error('Error al crear pedido:', err);
        Swal.fire({ 
          icon: 'error', 
          title: 'Error', 
          text: 'Ocurrió un problema al crear el pedido.' 
        });
      }
    });
  }

  private generarNotas(): string {
    const metodoPagoTexto = this.getMetodoPagoText();
    let textoNotas = `Pedido ${this.data.codigoPedido} - ${metodoPagoTexto} - Caja`;
    if (this.selectedMetodoPago === this.TIPO_PAGO.EFECTIVO && parseFloat(this.recibe) > 0) {
      textoNotas += ` - Recibe: S/${this.recibe} - Vuelto: S/${this.vuelto.toFixed(2)}`;
    }
    return textoNotas;
  }

  private mostrarMensajeExito(puntos: number, idPedido: number, idVenta: number) {
    let mensaje = `
      <div style="text-align: left;">
        <strong>${this.getTipoComprobanteText()} generada exitosamente</strong><br>
        • Pedido: <strong>${this.data.codigoPedido}</strong><br>
        • ID Pedido: <strong>${idPedido}</strong><br>
        • ID Venta: <strong>${idVenta}</strong><br>
        • Total: <strong>S/ ${this.data.total.toFixed(2)}</strong>
    `;

    if (this.selectedMetodoPago === this.TIPO_PAGO.EFECTIVO && parseFloat(this.recibe) > 0) {
      mensaje += `<br>• Recibido: <strong>S/ ${parseFloat(this.recibe).toFixed(2)}</strong>`;
      mensaje += `<br>• Vuelto: <strong>S/ ${this.vuelto.toFixed(2)}</strong>`;
    }

    if (puntos > 0) {
      mensaje += `<br>• <strong>¡Cliente ganó ${puntos} puntos! 🎉</strong>`;
    }

    mensaje += `</div>`;

    Swal.fire({
      icon: 'success',
      title: 'Venta Registrada',
      html: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#28a745'
    });
  }

  // ============================================================
  // 📄 GENERACIÓN DE PDF
  // ============================================================

  private generarComprobantePDF(idVenta: number, idPedido: number) {
    console.log(`Generando PDF para Venta #${idVenta}, Pedido #${idPedido}`);
    
    // Aquí puedes implementar la lógica de PDF del primer componente
    // Por ahora solo log
  }

  // ============================================================
  // 🔧 MÉTODOS HELPER (CAMBIADOS A PÚBLICOS PARA EL TEMPLATE)
  // ============================================================

  getMetodoPagoText(): string {
    switch(this.selectedMetodoPago) {
      case this.TIPO_PAGO.EFECTIVO: return 'Efectivo';
      case this.TIPO_PAGO.TARJETA: return 'Tarjeta';
      case this.TIPO_PAGO.BILLETERA: return 'Billetera Digital';
      default: return 'Efectivo';
    }
  }

  getTipoComprobanteText(): string {
    switch(this.selectedTipoComprobante) {
      case this.TIPO_VENTA.BOLETA: return 'Boleta';
      case this.TIPO_VENTA.FACTURA: return 'Factura';
      case this.TIPO_VENTA.NOTA: return 'Nota de Venta';
      default: return 'Comprobante';
    }
  }

  // ============================================================
  // 🧭 NAVEGACIÓN
  // ============================================================

  volverAComprobante() {
    this.pasoActual = 'comprobante';
    this.numeroDocumento = '';
  }

  volverAPago() {
    this.pasoActual = 'pago';
    this.selectedTipoComprobante = null;
  }

  cerrar() {
    this.dialogRef.close();
  }
}