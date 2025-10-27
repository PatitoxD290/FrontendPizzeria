// Tu archivo TypeScript corregido y adaptado a validación de correo

import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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

    // Expresión regular para validar correo electrónico
    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

    if (!correoValido && correo.length > 0) {
      this.CorreoError = 'Ingresa un correo electrónico válido (ejemplo@dominio.com)';
    } else {
      this.CorreoError = '';
    }

    this.Correo = correo;
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  login() {
    // Validar campos vacíos
    if (!this.Correo || !this.Password) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos vacíos',
        text: 'Por favor, ingresa tu correo y contraseña.',
        confirmButtonColor: '#722f37',
      });
      return;
    }

    // Validar formato de correo
    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.Correo);
    if (!correoValido) {
      Swal.fire({
        icon: 'warning',
        title: 'Correo inválido',
        text: 'Por favor, ingresa un correo electrónico válido.',
        confirmButtonColor: '#722f37',
      });
      return;
    }

    // Intentar inicio de sesión
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
