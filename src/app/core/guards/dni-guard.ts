import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class DniGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const dni = localStorage.getItem('dni'); // Verifica si hay un DNI guardado en localStorage

    if (dni) {
      return true; // Si hay un DNI, permite el acceso
    } else {
      // Si no hay DNI, redirige a la página de registro
      this.router.navigate(['/kiosko/registrar']);
      return false;
    }
  }
}
