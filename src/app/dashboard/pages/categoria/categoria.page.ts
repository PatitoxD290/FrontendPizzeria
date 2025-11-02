// src/app/dashboard/pages/categoria/categoria.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';

import { CategoriaListComponent } from '../../components/categoria/categoria-list/categoria-list.component';
import { TamanoListComponent } from '../../components/tamano/tamano-list/tamano-list.component';

@Component({
  selector: 'app-categoria',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    CategoriaListComponent,
    TamanoListComponent
  ],
  templateUrl: './categoria.page.html',
  styleUrls: ['./categoria.page.css']
})
export class CategoriaPage {}
