import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

// Services & Models
import { VentaService } from '../../../../core/services/venta.service';
import { PedidoService } from '../../../../core/services/pedido.service';
import { Venta } from '../../../../core/models/venta.model';
import { PedidoDetalle } from '../../../../core/models/pedido.model';

// PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-venta-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './venta-list.component.html',
  styleUrls: ['./venta-list.component.css']
})
export class VentaListComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = [
    'ID_Venta', 
    'Cliente', 
    'Tipo', 
    'Metodo', 
    'Total', 
    'Fecha', 
    'acciones'
  ];
  
  dataSource = new MatTableDataSource<Venta>([]);
  loading = false;

  // Filtros
  filtroTexto: string = '';
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  
  // Control PDF
  cargandoPDF: number | null = null; 

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private ventaService: VentaService,
    private pedidoService: PedidoService 
  ) {}

  ngOnInit(): void {
    this.cargarVentas();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.configurarFiltro();
  }

  cargarVentas(): void {
    this.loading = true;
    this.ventaService.getVentas().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar ventas:', err);
        this.loading = false;
      }
    });
  }

  // 🔍 Configuración del Filtro Personalizado
  configurarFiltro() {
    this.dataSource.filterPredicate = (v: Venta, filter: string) => {
      // 1. Filtro de Texto (CORREGIDO)
      const txt = this.filtroTexto.toLowerCase();
      
      // Usamos (valor || '') para asegurar que sea string y evitar errores de undefined
      const coincideTexto =
        (v.Cliente_Nombre || '').toLowerCase().includes(txt) ||
        v.ID_Venta.toString().includes(txt) ||
        (v.Tipo_Venta_Nombre || '').toLowerCase().includes(txt);

      // 2. Filtro de Fecha
      let coincideFecha = true;
      if (this.fechaInicio || this.fechaFin) {
        const fechaVenta = new Date(v.Fecha_Registro);
        fechaVenta.setHours(0,0,0,0);

        if (this.fechaInicio) {
          const inicio = new Date(this.fechaInicio);
          inicio.setHours(0,0,0,0);
          if (fechaVenta < inicio) coincideFecha = false;
        }
        
        if (this.fechaFin) {
          const fin = new Date(this.fechaFin);
          fin.setHours(23,59,59,999);
          if (fechaVenta > fin) coincideFecha = false;
        }
      }

      return coincideTexto && coincideFecha;
    };
  }

  aplicarFiltros(): void {
    // Disparamos el filtro actualizando la propiedad filter con un valor dummy
    // o usando la lógica que ya configuramos
    this.dataSource.filter = 'trigger'; 
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.fechaInicio = null;
    this.fechaFin = null;
    this.dataSource.filter = '';
    this.cargarVentas(); // Recargar fresco
  }

  // 🎨 Helpers Visuales
  
  // Detectar ID de Tipo de Pago para mostrar texto (Fallback si el nombre no viene)
  getMetodoPagoLabel(venta: Venta): string {
    if (venta.Metodo_Pago_Nombre) return venta.Metodo_Pago_Nombre;
    // Fallback a IDs quemados si el backend falla
    switch (venta.ID_Tipo_Pago) {
      case 1: return 'Efectivo';
      case 2: return 'Billetera Digital';
      case 3: return 'Tarjeta';
      default: return 'Otro';
    }
  }

  getTipoVentaLabel(venta: Venta): string {
    return venta.Tipo_Venta_Nombre || (venta.ID_Tipo_Venta === 1 ? 'Boleta' : 'Factura');
  }

  // ================================================================
  // 📄 GENERACIÓN DE PDF
  // ================================================================
  
  async generarPDFVenta(venta: Venta): Promise<void> {
    this.cargandoPDF = venta.ID_Venta;
    
    try {
      // Obtener detalles frescos
      const detallesPedido = await this.obtenerDetallesPedido(venta.ID_Pedido);
      
      // Decidir tipo de documento según ID_Tipo_Venta
      // 1: Boleta, 2: Factura, 3: Nota
      switch (venta.ID_Tipo_Venta) {
        case 1: // Boleta
          this.generarBoletaPDF(venta, detallesPedido);
          break;
        case 2: // Factura
          this.generarFacturaPDF(venta, detallesPedido);
          break;
        default:
          this.generarComprobanteGeneralPDF(venta, detallesPedido);
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.fire('Error', 'No se pudo generar el comprobante', 'error');
    } finally {
      this.cargandoPDF = null;
    }
  }

  private obtenerDetallesPedido(idPedido: number): Promise<PedidoDetalle[]> {
    return new Promise((resolve) => {
      this.pedidoService.getPedidoDetalles(idPedido).subscribe({
        next: (detalles) => resolve(detalles || []),
        error: () => resolve([])
      });
    });
  }

  // 🧾 Lógica PDF (Boleta)
  private generarBoletaPDF(venta: Venta, detalles: PedidoDetalle[]): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 297] });
    const pageWidth = 80;
    let y = 10;

    // Encabezado
    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text('BOLETA DE VENTA ELECTRÓNICA', pageWidth / 2, y, { align: 'center' });
    y += 5;
    
    doc.setFontSize(8);
    doc.text('AITA PIZZA S.A.C.', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text('RUC: 10713414561', pageWidth / 2, y, { align: 'center' });
    y += 6;

    // Info Venta
    doc.text(`Serie: B001-${venta.ID_Venta.toString().padStart(6, '0')}`, 5, y); y += 4;
    doc.text(`Fecha: ${new Date(venta.Fecha_Registro).toLocaleString()}`, 5, y); y += 4;
    doc.text(`Cliente: ${venta.Cliente_Nombre || 'Público General'}`, 5, y); y += 4;
    doc.text(`Pago: ${this.getMetodoPagoLabel(venta)}`, 5, y); y += 6;

    // Línea
    doc.line(5, y, pageWidth - 5, y); y += 4;

    // Detalles
    doc.setFontSize(7).setFont('helvetica', 'bold');
    doc.text('Cant.', 5, y); 
    doc.text('Descripción', 15, y); 
    doc.text('Total', 75, y, { align: 'right' });
    y += 4;

    doc.setFont('helvetica', 'normal');
    detalles.forEach(d => {
      const nombre = d.Nombre_Producto || d.Nombre_Combo || 'Item';
      // Nombre del producto/combo + tamaño si existe
      const desc = d.Tamano_Nombre ? `${nombre} (${d.Tamano_Nombre})` : nombre;
      
      // Dividir texto si es muy largo
      const splitTitle = doc.splitTextToSize(desc, 55);
      
      doc.text(d.Cantidad.toString(), 5, y);
      doc.text(splitTitle, 15, y);
      doc.text(Number(d.PrecioTotal).toFixed(2), 75, y, { align: 'right' });
      
      y += (splitTitle.length * 3) + 2;
    });

    y += 2;
    doc.line(5, y, pageWidth - 5, y); y += 5;

    // Totales
    doc.setFontSize(9).setFont('helvetica', 'bold');
    doc.text(`TOTAL: S/ ${Number(venta.Total).toFixed(2)}`, 75, y, { align: 'right' });
    y += 5;
    
    // Vuelto (si aplica)
    if (venta.ID_Tipo_Pago === 1 && venta.Monto_Recibido > 0) { // 1=Efectivo
      doc.setFontSize(7).setFont('helvetica', 'normal');
      doc.text(`Recibido: S/ ${Number(venta.Monto_Recibido).toFixed(2)}`, 75, y, { align: 'right' }); y += 4;
      doc.text(`Vuelto: S/ ${Number(venta.Vuelto).toFixed(2)}`, 75, y, { align: 'right' }); y += 6;
    }

    // Pie
    doc.setFontSize(7);
    doc.text('¡Gracias por su preferencia!', pageWidth / 2, y + 5, { align: 'center' });

    window.open(doc.output('bloburl'), '_blank');
  }

  // 🧾 Lógica PDF (Factura) - Similar a boleta pero con RUC
  private generarFacturaPDF(venta: Venta, detalles: PedidoDetalle[]): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 297] });
    const pageWidth = 80;
    let y = 10;

    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text('FACTURA ELECTRÓNICA', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(8);
    doc.text('AITA PIZZA S.A.C.', pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Info Factura
    doc.setFont('helvetica', 'normal');
    doc.text(`Serie: F001-${venta.ID_Venta.toString().padStart(6, '0')}`, 5, y); y += 4;
    doc.text(`RUC Cliente: 20... (Simulado)`, 5, y); y += 4; 
    doc.text(`Razón Social: ${venta.Cliente_Nombre}`, 5, y); y += 6;

    // ... (Resto igual a boleta: Detalles y Totales)
    // Reutilizamos lógica de detalles por brevedad
    doc.line(5, y, pageWidth - 5, y); y += 4;
    
    detalles.forEach(d => {
        const nombre = d.Nombre_Producto || d.Nombre_Combo || 'Item';
        const desc = d.Tamano_Nombre ? `${nombre} (${d.Tamano_Nombre})` : nombre;
        const split = doc.splitTextToSize(desc, 55);
        doc.text(d.Cantidad.toString(), 5, y);
        doc.text(split, 15, y);
        doc.text(Number(d.PrecioTotal).toFixed(2), 75, y, { align: 'right' });
        y += (split.length * 3) + 2;
    });

    doc.line(5, y, pageWidth - 5, y); y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: S/ ${Number(venta.Total).toFixed(2)}`, 75, y, { align: 'right' });

    window.open(doc.output('bloburl'), '_blank');
  }

  // Fallback
  private generarComprobanteGeneralPDF(venta: Venta, detalles: PedidoDetalle[]) {
    this.generarBoletaPDF(venta, detalles);
  }
}