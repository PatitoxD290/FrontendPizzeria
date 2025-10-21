// src/app/dashboard/pages/receta/receta.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { RecetaFormComponent } from '../../components/receta/receta-form/receta-form.component';
import { RecetaListComponent } from '../../components/receta/receta-list/receta-list.component';

@Component({
  selector: 'app-receta',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, RecetaListComponent],
  templateUrl: './receta.page.html',
  styleUrls: ['./receta.page.css']
})
export class RecetaPage {

  constructor(private dialog: MatDialog) {}

  openNuevaReceta(recetaList: RecetaListComponent) {
    const dialogRef = this.dialog.open(RecetaFormComponent, {
      width: '500px',
      data: {} // crear nueva receta
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) recetaList.loadRecetas();
    });
  }
}
