// src/app/dashboard/pages/ingrediente/ingrediente.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { IngredienteFormComponent } from '../../components/ingrediente/ingrediente-form/ingrediente-form.component';
import { IngredienteListComponent } from '../../components/ingrediente/ingrediente-list/ingrediente-list.component';

@Component({
  selector: 'app-ingrediente',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, IngredienteListComponent],
  templateUrl: './ingrediente.page.html',
  styleUrls: ['./ingrediente.page.css']
})
export class IngredientePage {
  constructor(private dialog: MatDialog) {}

  openNuevoIngrediente(ingredienteList: IngredienteListComponent) {
    const dialogRef = this.dialog.open(IngredienteFormComponent, { width: '500px', data: {} });
    dialogRef.afterClosed().subscribe(result => {
      if (result) ingredienteList.loadIngredientes();
    });
  }
}
