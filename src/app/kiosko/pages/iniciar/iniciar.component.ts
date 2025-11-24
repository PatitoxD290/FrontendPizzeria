import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-iniciar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './iniciar.component.html',
  styleUrls: ['./iniciar.component.css']
})
export class IniciarComponent implements OnInit, OnDestroy {

  constructor(private router: Router) {}

  ngOnInit(): void {
    // 🔹 Oculta el scroll del body cuando entras a esta pantalla
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden'; // asegura en html también
  }

  ngOnDestroy(): void {
    // 🔹 Restaura el scroll cuando sales de esta pantalla
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  }

  irMenu() {
    this.router.navigate(['/kiosko/menu']);
  }
}