// src/app/dashboard/pages/categoria/categoria.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CategoriaFormComponent } from '../../components/categoria/categoria-form/categoria-form.component';
import { CategoriaListComponent } from '../../components/categoria/categoria-list/categoria-list.component';

@Component({
  selector: 'app-categoria',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, CategoriaListComponent],
  templateUrl: './categoria.page.html',
  styleUrls: ['./categoria.page.css']
})
export class CategoriaPage {

  constructor(private dialog: MatDialog) {}

  openNuevaCategoria(categoriaList: CategoriaListComponent) {
    const dialogRef = this.dialog.open(CategoriaFormComponent, {
      width: '500px',
      data: {} // crear nueva categoría
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        categoriaList.loadCategorias(); // recargar lista
      }
    });
  }
}
