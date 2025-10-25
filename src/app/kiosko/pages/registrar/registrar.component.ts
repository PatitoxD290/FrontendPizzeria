import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-registrar',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './registrar.component.html',
  styleUrls: ['./registrar.component.css']
})
export class RegistrarComponent {
  dni: string = '';

  constructor(private router: Router) {}

  continuar() {
    if (this.dni.trim().length === 8) {
      this.router.navigate(['/kiosko/menu']);
    } else {
      alert('Ingrese un DNI válido de 8 dígitos');
    }
  }

  cancelar() {
    this.router.navigate(['/kiosko/iniciar']);
  }

  addNumber(num: string) {
    if (this.dni.length < 8) {
      this.dni += num;
    }
  }

  deleteLast() {
    this.dni = this.dni.slice(0, -1);
  }

  clear() {
    this.dni = '';
  }

  onInputChange(event: any) {
  // Asegura que solo acepte números
  const value = event.target.value.replace(/[^0-9]/g, '');
  this.dni = value.slice(0, 8); // Máximo 8 dígitos
  }
}
