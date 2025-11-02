import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import Swal from 'sweetalert2';

// Servicios y modelos
import { OrdenService } from '../../../../core/services/orden.service';
import { PedidoDetalle } from '../../../../core/models/pedido.model';
import { PedidoService } from '../../../../core/services/pedido.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { Cliente } from '../../../../core/models/cliente.model';
import { TamanoService } from '../../../../core/services/tamano.service';
import { Tamano } from '../../../../core/models/tamano.model';

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
  ],
  templateUrl: './detalle-pedido.component.html',
  styleUrls: ['./detalle-pedido.component.css'],
})
export class DetallePedidoComponent implements OnInit {
  detalles: PedidoDetalle[] = [];
  tamanos: Tamano[] = [];
  displayedColumns = ['producto', 'tamano', 'cantidad', 'precio', 'subtotal', 'acciones'];
  nombreCliente: string = '';
  codigoPedido: string = ''; // 🔹 Aquí se guardará el código generado

  constructor(
    private ordenService: OrdenService,
    private pedidoService: PedidoService,
    private authService: AuthService,
    private clienteService: ClienteService,
    private tamanoService: TamanoService
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

    // 🔹 Generar un código de pedido al iniciar
    this.generarCodigoPedido();
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

  // ✅ Genera código tipo "12AB"
  generarCodigoPedido() {
    const numeros = '0123456789';
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let codigo = '';

    for (let i = 0; i < 2; i++) {
      codigo += numeros.charAt(Math.floor(Math.random() * numeros.length));
    }

    for (let i = 0; i < 2; i++) {
      codigo += letras.charAt(Math.floor(Math.random() * letras.length));
    }

    this.codigoPedido = codigo;
  }

realizarPedido() {
   if (this.detalles.length === 0) {
    Swal.fire({ icon: 'warning', title: 'Carrito vacío', text: 'Agrega productos antes de realizar el pedido.' });
    return;
  }

  // 🔹 Evitar enviar productos con cantidad 0
  const conCantidadCero = this.detalles.some(d => d.Cantidad <= 0);
  if (conCantidadCero) {
    Swal.fire({
      icon: 'error',
      title: 'Cantidad inválida detectada',
      text: 'Hay productos con cantidad igual a 0 en el pedido. Corrige antes de continuar.',
      confirmButtonColor: '#1976d2'
    });
    return;
  }

  const usuarioLogueado = this.authService.getUser();
  const idUsuario = usuarioLogueado?.ID_Usuario ?? 1;

  if (this.nombreCliente.trim() !== '') {
    const [nombre, apellido = ''] = this.nombreCliente.trim().split(' ');

    const nuevoCliente: Partial<Cliente> = {
      Nombre: nombre,
      Apellido: apellido,
      DNI: '',
      Telefono: '',
      Fecha_Registro: new Date().toISOString().split('T')[0],
    };

    this.clienteService.createCliente(nuevoCliente).subscribe({
      next: (clienteCreado: Cliente) => {
        const idCliente = clienteCreado.ID_Cliente; // ✅ ID del cliente recién creado
        this.enviarPedido(idUsuario, idCliente);
      },
      error: (err) => {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo crear el cliente.' });
      }
    });
  } else {
    this.enviarPedido(idUsuario, 1); // Cliente genérico
  }
}



private enviarPedido(idUsuario: number, idCliente: number) {
  const pedido = {
    ID_Pedido: 0,
    ID_Cliente: idCliente, // 🔹 aquí ya estará el ID correcto
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
      PrecioTotal: d.PrecioTotal,
      nombre_producto: d.nombre_producto,
      nombre_categoria: d.nombre_categoria,
    })),
  };

  console.log('📦 Pedido a enviar:', pedido);

  this.pedidoService.createPedido(pedido).subscribe({
    next: () => {
      Swal.fire({
        icon: 'success',
        title: 'Pedido realizado',
        text: `El pedido fue enviado correctamente.\nCódigo: ${this.codigoPedido}`,
      });
      this.ordenService.limpiar();
      this.nombreCliente = '';
      this.generarCodigoPedido(); // nuevo código para el siguiente pedido
    },
    error: (err) => {
      console.error('❌ Error al registrar pedido:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un problema al realizar el pedido.',
      });
    },
  });
}
}
