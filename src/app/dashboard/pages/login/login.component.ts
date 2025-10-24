// Tu archivo TypeScript se mantiene igual, solo he corregido el método togglePassword
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
  dni = '';
  password = '';
  hidePassword = true;
  dniError = '';
  rememberMe = false;

  @ViewChild('dniInput') dniInputRef!: ElementRef<HTMLInputElement>;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard/home'], { replaceUrl: true });
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.dniInputRef?.nativeElement?.focus(), 100);
  }

  onDniInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const soloNumeros = input.value.replace(/\D/g, '');

    if (input.value !== soloNumeros) {
      input.value = soloNumeros;
      this.dniError = 'Solo se permiten números';
    } else {
      this.dniError = '';
    }

    this.dni = soloNumeros;
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  login() {
    if (!this.dni || !this.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos vacíos',
        text: 'Por favor, ingresa tu DNI y contraseña.',
        confirmButtonColor: '#722f37',
      });
      return;
    }

    if (this.dni.length !== 8) {
      Swal.fire({
        icon: 'warning',
        title: 'DNI inválido',
        text: 'El DNI debe tener exactamente 8 dígitos.',
        confirmButtonColor: '#722f37',
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