import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalStateService {
  private modalCounter = 0;
  private modalAbiertoSubject = new BehaviorSubject<boolean>(false);
  public modalAbierto$ = this.modalAbiertoSubject.asObservable();

  // 🔹 NUEVO: Método para abrir modal (incrementar contador)
  abrirModal(): void {
    this.modalCounter++;
    this.actualizarEstado();
  }

  // 🔹 NUEVO: Método para cerrar modal (decrementar contador)
  cerrarModal(): void {
    if (this.modalCounter > 0) {
      this.modalCounter--;
    }
    this.actualizarEstado();
  }

  // 🔹 NUEVO: Método para actualizar el estado basado en el contador
  private actualizarEstado(): void {
    const hayModalesAbiertos = this.modalCounter > 0;
    this.modalAbiertoSubject.next(hayModalesAbiertos);
    console.log('Contador de modales:', this.modalCounter, 'Estado:', hayModalesAbiertos);
  }

  // 🔹 MÉTODO ORIGINAL (mantener para compatibilidad)
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

  // 🔹 NUEVO: Obtener contador actual (para debugging)
  getContadorModales(): number {
    return this.modalCounter;
  }
}