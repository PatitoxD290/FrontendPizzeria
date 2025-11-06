import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioListComponent } from '../../components/usuario/usuario-list/usuario-list.component';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [CommonModule, UsuarioListComponent],
  templateUrl: './usuario.page.html',
  styleUrls: ['./usuario.page.css']
})
export class UsuarioPage {}
