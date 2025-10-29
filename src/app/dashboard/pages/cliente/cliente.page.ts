// src/app/dashboard/pages/cliente/cliente.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteListComponent } from '../../components/cliente/cliente-list/cliente-list.component';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, ClienteListComponent],
  templateUrl: './cliente.page.html',
  styleUrls: ['./cliente.page.css']
})
export class ClientePage {}
