import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalStateService {
  private modalCounter = 0;
  private modalAbiertoSubject = new BehaviorSubject<boolean>(false);
  public modalAbierto$ = this.modalAbiertoSubject.asObservable();

  abrirModal(): void {
    this.modalCounter++;
    // ✅ USAR setTimeout PARA EL PRÓXIMO CICLO DE DETECCIÓN DE CAMBIOS
    setTimeout(() => {
      this.modalAbiertoSubject.next(this.modalCounter > 0);
    });
    console.log('🔄 Modal abierto - Contador:', this.modalCounter);
  }

  cerrarModal(): void {
    if (this.modalCounter > 0) {
      this.modalCounter--;
    }
    // ✅ USAR setTimeout PARA EL PRÓXIMO CICLO DE DETECCIÓN DE CAMBIOS
    setTimeout(() => {
      this.modalAbiertoSubject.next(this.modalCounter > 0);
    });
    console.log('🔄 Modal cerrado - Contador:', this.modalCounter);
  }

  // Mantener métodos existentes para compatibilidad
  setModalAbierto(abierto: boolean): void {
    if (abierto) {
      this.abrirModal();
    } else {
      this.cerrarModal();
    }
  }

  getModalAbierto(): boolean {
    return this.modalAbiertoSubject.value;
  }

  getContadorModales(): number {
    return this.modalCounter;
  }
}