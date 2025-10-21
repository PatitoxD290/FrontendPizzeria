// src/app/dashboard/components/producto/producto-list/producto-list.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../../core/models/producto.model';
import { ProductoService } from '../../../services/producto.service';
import { CategoriaService } from '../../../services/categoria.service';
import { RecetaService } from '../../../services/receta.service';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductoFormComponent } from '../producto-form/producto-form.component';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule
  ],
  templateUrl: './producto-list.component.html',
  styleUrls: ['./producto-list.component.css']
})
export class ProductoListComponent implements OnInit {

  displayedColumns: string[] = [
    'producto_id',
    'nombre_producto',
    'descripcion_producto',
    'categoria',
    'receta',
    'precio_venta',
    'estado',
    'fecha_registro',
    'acciones'
  ];
  
  productos: any[] = [];
  categorias: any[] = [];
  recetas: any[] = [];
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private recetaService: RecetaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProductos();
  }

  loadProductos() {
    this.loading = true;
    Promise.all([
      this.categoriaService.getCategorias().toPromise(),
      this.recetaService.getRecetas().toPromise(),
      this.productoService.getProductos().toPromise()
    ])
    .then(([categorias, recetas, productos]) => {
      this.categorias = categorias || [];
      this.recetas = recetas || [];

      // Enlazar nombres de categoría y receta a cada producto
      this.productos = (productos || []).map(p => ({
        ...p,
        nombre_categoria: this.categorias.find(c => c.categoria_id === p.categoria_id)?.nombre_categoria || 'Sin categoría',
        nombre_receta: this.recetas.find(r => r.receta_id === p.receta_id)?.nombre_receta || 'Sin receta'
      }));

      this.loading = false;
      setTimeout(() => {
        if (this.paginator) this.paginator.length = this.productos.length;
      });
    })
    .catch(err => {
      console.error('Error al cargar datos', err);
      this.loading = false;
    });
  }

  deleteProducto(id: number) {
    if (!confirm('¿Eliminar este producto?')) return;
    this.productoService.deleteProducto(id).subscribe({
      next: () => this.loadProductos(),
      error: err => console.error(err)
    });
  }

  openProductoForm(producto?: Producto) {
    const dialogRef = this.dialog.open(ProductoFormComponent, {
      width: '500px',
      data: { producto }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadProductos();
    });
  }
}
