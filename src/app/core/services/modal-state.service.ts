import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalStateService {
  private modalAbiertoSubject = new BehaviorSubject<boolean>(false);
  public modalAbierto$ = this.modalAbiertoSubject.asObservable();

  setModalAbierto(abierto: boolean): void {
    this.modalAbiertoSubject.next(abierto);
  }

  getModalAbierto(): boolean {
    return this.modalAbiertoSubject.value;
  }
}