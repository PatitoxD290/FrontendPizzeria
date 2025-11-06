import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select'; // 🔹 nuevo
import Swal from 'sweetalert2';

// Servicios y modelos
import { VentaService } from '../../../../core/services/venta.service';

import { OrdenService } from '../../../../core/services/orden.service';
import { PedidoDetalle } from '../../../../core/models/pedido.model';
import { PedidoService } from '../../../../core/services/pedido.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { TamanoService } from '../../../../core/services/tamano.service';
import { Tamano } from '../../../../core/models/tamano.model';

import { MatDialog } from '@angular/material/dialog';
import { VentaPedidoComponent } from '../venta-pedido/venta-pedido.component'; // ruta correcta


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
    MatSelectModule, // 🔹 nuevo
  ],
  templateUrl: './detalle-pedido.component.html',
  styleUrls: ['./detalle-pedido.component.css'],
})
export class DetallePedidoComponent implements OnInit {
  detalles: PedidoDetalle[] = [];
  tamanos: Tamano[] = [];
  displayedColumns = ['producto', 'tamano', 'cantidad', 'precio', 'subtotal', 'acciones'];
  
  tipoDocumento: 'DNI' | 'RUC' = 'DNI'; // 🔹 nuevo
  numeroDocumento: string = ''; // antes era nombreCliente
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
        this.ordenService.detalles$.subscribe((detalles) => {
          this.detalles = detalles.map((d) => ({
            ...d,
            nombre_tamano: this.getNombreTamano(d.ID_Tamano),
          }));
        });
      },
      error: (err) => console.error('Error al cargar tamaños:', err),
    });

    this.generarCodigoPedido();
  }
  soloNumeros(event: any) {
    this.numeroDocumento = event.target.value.replace(/[^0-9]/g, '');
  }


  getNombreTamano(idTamano: number): string {
    const tamano = this.tamanos.find((t) => t.ID_Tamano === idTamano);
    return tamano ? tamano.Tamano : '—';
  }

  aumentarCantidad(detalle: PedidoDetalle) {
    const precioUnitario = detalle.PrecioTotal / detalle.Cantidad;
    this.ordenService.aumentarCantidad(detalle.ID_Producto, detalle.ID_Tamano, precioUnitario);
  }

  reducirCantidad(detalle: PedidoDetalle) {
    if (detalle.Cantidad > 1) {
      const precioUnitario = detalle.PrecioTotal / detalle.Cantidad;
      this.ordenService.reducirCantidad(detalle.ID_Producto, detalle.ID_Tamano, precioUnitario);
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
        this.ordenService.eliminarProducto(detalle.ID_Producto, detalle.ID_Tamano);
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
    width: '400px',
    data: { total: this.getTotal() }
  });

  dialogRef.afterClosed().subscribe((result) => {
  if (!result) return;

  // 🔹 Convertir método a la sigla correcta
  const metodoPagoMap: any = {
    'EFECTIVO': 'E',
    'TARJETA': 'T',
    'BILLETERA': 'B' // Yape / Plin
  };

  const metodoPagoConvertido = metodoPagoMap[result.metodoPago];

  this.enviarPedido(idUsuario, idCliente, metodoPagoConvertido, result.recibe, result.vuelto);
});

}



private enviarPedido(idUsuario: number, idCliente: number, metodoPago: 'E' | 'T' | 'B', recibe: number, vuelto: number) {
  const pedido = {
    ID_Pedido: 0,
    ID_Cliente: idCliente,
    ID_Usuario: idUsuario,
    Notas: this.codigoPedido,
    SubTotal: this.getTotal(),
    Estado_P: 'P' as 'P',
    Fecha_Registro: new Date().toISOString().split('T')[0],
    Hora_Pedido: new Date().toTimeString().split(' ')[0],
    detalles: this.detalles.map((d) => ({
    ID_Pedido_D: 0,
    ID_Pedido: 0,
    ID_Producto: d.ID_Producto,
    ID_Tamano: d.ID_Tamano,
    Cantidad: d.Cantidad,
    PrecioTotal: d.PrecioTotal
  })) as PedidoDetalle[],

  };

  this.pedidoService.createPedido(pedido).subscribe({
    next: (res) => {
      const idPedidoCreado = res.ID_Pedido;

      // ✅ Registrar Venta
      this.ventaService.createVenta({
        ID_Pedido: idPedidoCreado,

        // ✅ Determinar tipo de venta según documento ingresado
        Tipo_Venta: (() => {
          if (!this.numeroDocumento.trim()) return 'N'; // Sin documento → Nota
          if (this.tipoDocumento === 'DNI') return 'B'; // DNI → Boleta
          if (this.tipoDocumento === 'RUC') return 'F'; // RUC → Factura
          return 'N';
        })(),

        Metodo_Pago: metodoPago, // E | T | B
        Lugar_Emision: 'A',
        IGV_Porcentaje: 18
      }).subscribe(() => {


        
        Swal.fire({ icon: 'success', title: 'Venta Registrada', text: 'Pedido y pago guardados correctamente.' });

        this.ordenService.limpiar();
        this.numeroDocumento = '';
        this.generarCodigoPedido();
      });

    },
    error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Ocurrió un problema.' }),
  });
}

}
