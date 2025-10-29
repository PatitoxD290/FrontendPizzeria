import { Component } from '@angular/core';
import { VentaListComponent } from '../../components/venta/venta-list/venta-list.component'; // ✅ ajusta la ruta según tu estructura

@Component({
  selector: 'app-venta',
  standalone: true,
  imports: [VentaListComponent], // ✅ importamos el componente standalone
  templateUrl: './venta.page.html',
  styleUrls: ['./venta.page.css']
})
export class VentaPage { }
