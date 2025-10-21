import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// SweetAlert2
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  dni = '';
  password = '';
  hidePassword = true;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Si ya está logueado, redirige al home directamente
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard/home'], { replaceUrl: true });
    }
  }

  login() {
    // Validaciones básicas antes de enviar
    if (!this.dni || !this.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos vacíos',
        text: 'Por favor ingresa tu DNI y contraseña.',
        confirmButtonColor: '#dc2626',
      });
      return;
    }

    if (this.dni.length !== 8) {
      Swal.fire({
        icon: 'warning',
        title: 'DNI inválido',
        text: 'El DNI debe tener exactamente 8 dígitos.',
        confirmButtonColor: '#dc2626',
      });
      return;
    }

    this.authService.login(this.dni, this.password).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Bienvenido',
          text: 'Inicio de sesión exitoso.',
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          this.router.navigate(['/dashboard/home']);
        });
      },
      error: (err) => {
        console.error('Login error:', err);
        const msg = err?.error?.error || 'Credenciales incorrectas';

        Swal.fire({
          icon: 'error',
          title: 'Error de inicio de sesión',
          text: msg,
          confirmButtonColor: '#dc2626',
        });
      }
    });
  }

  onDniInput(event: any) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, ''); // solo números
    this.dni = input.value;
  }
}
