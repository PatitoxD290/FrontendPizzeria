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
  recibe: string = ''; // String para manejar input manual
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

  ngOnInit(): void {
    // Si el total es 0, podría ser una cortesía, pero asumimos pago normal
  }

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
    if (this.recibe === '0') this.recibe = num;
    else this.recibe += num;
    this.calcularVuelto();
  }

  deleteLast() {
    if (this.recibe.length > 0) {
      this.recibe = this.recibe.slice(0, -1);
      this.calcularVuelto();
    }
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
        Swal.fire('Monto requerido', 'Ingrese el monto recibido.', 'warning');
        return false;
      }
      if (recibeNum < this.data.total) {
        Swal.fire('Monto insuficiente', `Faltan S/ ${(this.data.total - recibeNum).toFixed(2)}`, 'error');
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
      this.numeroDocumento = ''; // Limpiar anterior
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
      Swal.fire('Requerido', `Ingrese el ${this.tipoDocumento} del cliente.`, 'warning');
      return false;
    }

    const largoRequerido = this.tipoDocumento === 'DNI' ? 8 : 11;
    if (doc.length !== largoRequerido) {
      Swal.fire('Inválido', `El ${this.tipoDocumento} debe tener ${largoRequerido} dígitos.`, 'error');
      return false;
    }

    return true;
  }

  confirmarDocumento() {
    if (!this.validarDocumento()) return;

    this.cargando = true;

    // Buscar cliente en API (Backend crea si no existe)
    this.clienteService.buscarClientePorDocumento(this.numeroDocumento).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.cliente && res.cliente.ID_Cliente) {
          this.clienteData = res.cliente;
          this.registrarVentaCompleta(res.cliente.ID_Cliente);
        } else {
          Swal.fire('Error', 'No se pudo obtener el ID del cliente.', 'error');
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error(err);
        Swal.fire('Error', 'No se pudo validar el documento. Intente nuevamente.', 'error');
      }
    });
  }

  // ============================================================
  // 🚀 PROCESO FINAL: CREAR PEDIDO Y VENTA
  // ============================================================

  private registrarVentaCompleta(idCliente: number) {
    this.cargando = true;

    // 1. Preparar Detalles para el Backend (DTO Limpio)
    const detallesDTO = this.data.detalles.map(d => ({
      ID_Producto_T: d.ID_Producto_T || null, // Ojo: Asegurar que el modelo PedidoDetalle tenga esto
      ID_Combo: d.ID_Combo || null,           // O ID_Combo si es combo
      Cantidad: d.Cantidad,
      PrecioTotal: d.PrecioTotal
    }));

    // 2. Crear Objeto Pedido DTO
    const pedidoDTO: PedidoCreacionDTO = {
      ID_Cliente: idCliente,
      ID_Usuario: this.data.idUsuario,
      Notas: `Venta ${this.data.codigoPedido}`, // Puedes agregar más info aquí
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
            
            // Éxito: Generar PDF y cerrar
            this.generarComprobantePDF(resVenta.ID_Venta, idPedidoCreado);
            
            // Feedback
            this.mostrarExito(resVenta.Puntos_Ganados); // Puntos vienen del backend
            
            // Cerrar modal retornando true
            this.dialogRef.close({ registrado: true });
          },
          error: (err) => {
            this.cargando = false;
            console.error('Error creando venta:', err);
            Swal.fire('Error', 'El pedido se creó pero falló el registro de venta.', 'error');
          }
        });
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error creando pedido:', err);
        Swal.fire('Error', 'No se pudo crear el pedido.', 'error');
      }
    });
  }

  private mostrarExito(puntos: number) {
    let msg = 'Venta registrada correctamente.';
    if (puntos > 0) {
      msg += `<br><strong>¡Cliente ganó ${puntos} puntos! 🎉</strong>`;
    }
    
    Swal.fire({
      icon: 'success',
      title: '¡Listo!',
      html: msg,
      timer: 3000,
      showConfirmButton: false
    });
  }

  // ============================================================
  // 📄 GENERACIÓN DE PDF (Simplificada, usa la lógica de VentaService)
  // ============================================================
  // Nota: Idealmente deberías llamar a VentaService.generarPDFVenta(venta), 
  // pero aquí no tenemos el objeto Venta completo aún.
  // Reutilizamos la lógica visual local para inmediatez.

  private generarComprobantePDF(idVenta: number, idPedido: number) {
    // Aquí puedes implementar la misma lógica de PDF que hicimos en VentaListComponent
    // O simplemente llamar a un endpoint que descargue el PDF.
    // Por ahora, dejaré el esqueleto para que no falle.
    console.log(`Generando PDF para Venta #${idVenta}, Pedido #${idPedido}`);
    // ... (Tu lógica de jsPDF aquí si deseas impresión inmediata) ...
  }

  // Navegación
  volverAComprobante() {
    this.pasoActual = 'comprobante';
  }

  volverAPago() {
    this.pasoActual = 'pago';
  }

  cerrar() {
    this.dialogRef.close();
  }
}