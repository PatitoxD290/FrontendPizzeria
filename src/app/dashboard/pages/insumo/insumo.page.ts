// src/app/dashboard/pages/ingrediente/ingrediente.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsumoListComponent } from '../../components/ingrediente/insumo-list/insumo-list.component';

@Component({
  selector: 'app-ingrediente',
  standalone: true,
  imports: [CommonModule, InsumoListComponent],
  templateUrl: './insumo.page.html',
  styleUrls: ['./insumo.page.css']
})
export class insumoPage {
}