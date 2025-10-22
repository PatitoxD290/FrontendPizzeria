// src/app/dashboard/components/categoria/categoria-list/categoria-list.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Categoria } from '../../../../core/models/categoria.model';
import { CategoriaService } from '../../../services/categoria.service';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CategoriaFormComponent } from '../categoria-form/categoria-form.component';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule
  ],
  templateUrl: './categoria-list.component.html',
  styleUrls: ['./categoria-list.component.css']
})
export class CategoriaListComponent implements OnInit {

  displayedColumns: string[] = ['categoria_id', 'nombre_categoria', 'descripcion_categoria', 'acciones'];
  categorias: Categoria[] = [];
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private categoriaService: CategoriaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias() {
    this.loading = true;
    this.categoriaService.getCategorias().subscribe({
      next: data => {
        this.categorias = data;
        this.loading = false;
        setTimeout(() => {
          if (this.paginator) {
            this.paginator.length = this.categorias.length;
          }
        });
      },
      error: err => {
        console.error('Error al cargar categorías', err);
        this.loading = false;
      }
    });
  }

  deleteCategoria(id: number) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    this.categoriaService.deleteCategoria(id).subscribe({
      next: () => this.loadCategorias(),
      error: err => console.error('Error al eliminar categoría', err)
    });
  }

  openCategoriaForm(categoria?: Categoria) {
    const dialogRef = this.dialog.open(CategoriaFormComponent, {
      width: '400px',
      data: { categoria }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadCategorias();
    });
  }
}
