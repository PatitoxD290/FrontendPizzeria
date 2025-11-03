// src/app/core/services/idle.service.ts
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class IdleService {
  private timeoutId: any;
  private readonly idleTime = 2 * 60 * 1000;

  constructor(private router: Router, private ngZone: NgZone) {
    this.initListener();
    this.startTimer();
  }

  private initListener() {
    const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, () => this.resetTimer());
    });
  }

  private startTimer() {
    this.timeoutId = setTimeout(() => {
      this.ngZone.run(() => {
        if (!this.router.url.includes('/iniciar')) {
          this.router.navigate(['/kiosko/iniciar']);
        }
      });
    }, this.idleTime);
  }

  private resetTimer() {
    clearTimeout(this.timeoutId);
    this.startTimer();
  }
}
