import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-iniciar',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './iniciar.component.html',
  styleUrls: ['./iniciar.component.css']
})
export class IniciarComponent {
  constructor(private router: Router) {}

  irMenu() {
  this.router.navigate(['/kiosko/menu']);
  }
}
