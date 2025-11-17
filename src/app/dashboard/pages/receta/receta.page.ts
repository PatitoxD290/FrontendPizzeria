import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecetaListComponent } from '../../components/receta/receta-list/receta-list.component';

@Component({
  selector: 'app-receta',
  standalone: true,
  imports: [
    CommonModule,
    RecetaListComponent
  ],
  templateUrl: './receta.page.html',
  styleUrls: ['./receta.page.css']
})
export class RecetaPage {}
