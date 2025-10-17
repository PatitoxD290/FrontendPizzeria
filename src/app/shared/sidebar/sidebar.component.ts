import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  isCollapsed = false;
  isLoggedIn = false;

  constructor(private router: Router, private authService: AuthService) {
    this.checkUser();

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        startWith(null)
      )
      .subscribe(() => {
        this.checkUser();
      });
  }

  checkUser() {
    const user = this.authService.getUser();
    this.isLoggedIn = !!user;
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
