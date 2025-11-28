// Tu archivo TypeScript corregido
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit {
  Correo = '';
  Password = '';
  hidePassword = true;
  CorreoError = '';
  rememberMe = false;

  @ViewChild('CorreoInput') CorreoInputRef!: ElementRef<HTMLInputElement>;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard/home'], { replaceUrl: true });
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.CorreoInputRef?.nativeElement?.focus(), 100);
  }

  onCorreoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const correo = input.value.trim();

    // Solo validar formato básico mientras escribe, sin mostrar alertas
    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

    if (!correoValido && correo.length > 0) {
      this.CorreoError = 'Ingresa un correo electrónico válido';
    } else {
      this.CorreoError = '';
    }

    this.Correo = correo;
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  login() {
    // Limpiar mensajes de error previos
    this.CorreoError = '';

    let hasError = false;
    let errorMessage = '';

    // Validar campos vacíos
    if (!this.Correo.trim() || !this.Password.trim()) {
      hasError = true;
      errorMessage = 'Por favor, ingresa tu correo y contraseña.';
    }
    // Validar formato de correo solo si no está vacío
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.Correo)) {
      hasError = true;
      errorMessage = 'Por favor, ingresa un correo electrónico válido.';
      this.CorreoError = 'Ingresa un correo electrónico válido (ejemplo@dominio.com)';
    }

    // Mostrar alerta si hay errores
    if (hasError) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos incorrectos',
        text: errorMessage,
        confirmButtonColor: '#722f37',
      });
      return;
    }

    // Si todo está bien, proceder con el login
    this.authService.login(this.Correo, this.Password).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Bienvenido',
          text: 'Inicio de sesión exitoso.',
          showConfirmButton: false,
          timer: 1500
        });

        setTimeout(() => {
          this.router.navigate(['/dashboard/home']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error de inicio de sesión:', err);
        const msg = err?.error?.error || 'Credenciales incorrectas';
        Swal.fire({
          icon: 'error',
          title: 'Error de inicio de sesión',
          text: msg,
          confirmButtonColor: '#722f37',
        });
      }
    });
  }
}