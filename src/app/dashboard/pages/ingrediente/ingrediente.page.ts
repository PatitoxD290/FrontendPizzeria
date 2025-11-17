// src/app/dashboard/pages/ingrediente/ingrediente.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IngredienteListComponent } from '../../components/ingrediente/ingrediente-list/ingrediente-list.component';

@Component({
  selector: 'app-ingrediente',
  standalone: true,
  imports: [CommonModule, IngredienteListComponent],
  templateUrl: './ingrediente.page.html',
  styleUrls: ['./ingrediente.page.css']
})
export class IngredientePage {
}