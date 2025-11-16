import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';

import { ProductoListComponent } from '../../components/producto/producto-list/producto-list.component';
import { ComboListComponent } from '../../components/combo/combo-list/combo-list.component';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDialogModule,
    ProductoListComponent,
    ComboListComponent
  ],
  templateUrl: './producto.page.html',
  styleUrls: ['./producto.page.css']
})
export class ProductoPage {
  selectedTab = 0; // 0 = Productos, 1 = Combos

  onTabChange(event: number): void {
    this.selectedTab = event;
  }
}