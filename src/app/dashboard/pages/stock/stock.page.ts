import { Component } from '@angular/core';
import { StockListComponent } from '../../components/stock/stock-list/stock-list.component';

@Component({
  selector: 'app-stock',
  imports: [StockListComponent],
  templateUrl: './stock.page.html',
  styleUrl: './stock.page.css'
})
export class StockPage {

}