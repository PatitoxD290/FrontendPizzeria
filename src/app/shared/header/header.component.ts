import { Component } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, Data } from '@angular/router';
import { filter, map, mergeMap, startWith } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  titulo: string = '';
  subtitulo: string = '';

  constructor(private router: Router, private route: ActivatedRoute) {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        startWith(null), // 👈 fuerza que también se ejecute al iniciar
        map(() => this.route),
        map(route => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        mergeMap(route => route.data)
      )
      .subscribe((data: Data) => {
        this.titulo = data['title'] ?? '';
        this.subtitulo = data['subtitle'] ?? '';
      });
  }
}
