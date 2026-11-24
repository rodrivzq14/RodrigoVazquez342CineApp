import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { FechaArPipe } from '../../pipes/fecha-ar-pipe';
import { Notificacion } from '../../models/notificacion';

/** Campanita del navbar con el panel de notificaciones */
@Component({
  imports: [FechaArPipe],
  selector: 'app-notificaciones',
  styleUrl: './notificaciones.css',
  templateUrl: './notificaciones.html',
})
export class Notificaciones {
  readonly servicio = inject(NotificationService);
  private router = inject(Router);
  private host = inject(ElementRef);

  readonly abierto = signal(false);

  // Cerrar el panel al hacer click afuera
  @HostListener('document:click', ['$event'])
  clickAfuera(e: MouseEvent) {
    if (!this.host.nativeElement.contains(e.target)) this.abierto.set(false);
  }

  async abrir(n: Notificacion) {
    if (!n.leida) await this.servicio.marcarLeida(n.id);
    this.abierto.set(false);
    if (n.link) this.router.navigateByUrl(n.link);
  }
}
