import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as QRCode from 'qrcode';
import { OrderService } from '../../services/order.service';
import { OrderDetail } from '../../models/order';

const ZONA = 'America/Argentina/Buenos_Aires';

@Component({
  selector: 'app-confirmation',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.css',
})
export class Confirmation implements OnInit {
  private orders = inject(OrderService);

  readonly id = input.required<string>();
  readonly t = input<string>(); // access_token, llega como query param ?t=...

  readonly orden = signal<OrderDetail | null>(null);
  readonly qrs = signal<Record<number, string>>({});
  readonly error = signal('');
  readonly cargando = signal(true);

  async ngOnInit() {
    try {
      const orden = await this.orders.getOrder(Number(this.id()), this.t() ?? '');
      this.orden.set(orden);

      // Un QR por entrada: el contenido es el token secreto de esa entrada
      const pares = await Promise.all(
        orden.entradas.map(async (e) => [e.id, await QRCode.toDataURL(e.qr_token, { width: 240, margin: 1 })] as const),
      );
      this.qrs.set(Object.fromEntries(pares));
    } catch {
      this.error.set('No encontramos esta compra. Revisá el enlace.');
    } finally {
      this.cargando.set(false);
    }
  }

  fechaLarga(iso: string): string {
    return new Date(iso).toLocaleString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA,
    });
  }
}