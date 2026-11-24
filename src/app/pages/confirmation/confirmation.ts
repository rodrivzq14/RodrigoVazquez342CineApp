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

  /** Una página por entrada, con los datos de la función, el QR y el código para cargarlo a mano */
  async descargarPdf() {
    const o = this.orden();
    if (!o) return;

    // jspdf se carga recién cuando alguien pide el PDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: [100, 170] }); // tamaño "entrada"

    o.entradas.forEach((e, i) => {
      if (i > 0) doc.addPage();

      doc.setFillColor(13, 11, 14);
      doc.rect(0, 0, 100, 28, 'F');
      doc.setTextColor(232, 176, 74);
      doc.setFontSize(20);
      doc.text('CINE', 8, 13);
      doc.setFontSize(9);
      doc.text(`Orden #${o.order_id}`, 8, 21);

      doc.setTextColor(20, 20, 20);
      doc.setFontSize(15);
      doc.text(doc.splitTextToSize(o.funcion.titulo, 84), 8, 38);
      doc.setFontSize(10);
      doc.text(this.fechaLarga(o.funcion.starts_at), 8, 50);
      doc.text(`${o.funcion.formato} · ${o.funcion.idioma} · ${o.funcion.sala}`, 8, 56);
      doc.setFontSize(13);
      doc.text(`Butaca ${e.butaca}${e.tipo === 'vip' ? '  (VIP)' : e.tipo === 'accesible' ? '  (Accesible)' : ''}`, 8, 65);

      const qr = this.qrs()[e.id];
      if (qr) doc.addImage(qr, 'PNG', 25, 72, 50, 50);
      doc.setFontSize(12);
      doc.text(e.qr_token.slice(0, 8), 50, 128, { align: 'center' });
      doc.setFontSize(8);
      doc.text('Válido una sola vez', 50, 133, { align: 'center' });

      let y = 142;
      if (o.funcion.edad_minima > 0) {
        doc.setTextColor(200, 50, 60);
        doc.text(doc.splitTextToSize(`Mayores de ${o.funcion.edad_minima} años. Los menores deben ir acompañados por un adulto.`, 84), 8, y);
        y += 8;
      }
      // El candy va en la primera entrada (se retira con cualquier QR de la compra)
      if (i === 0 && o.items.length) {
        doc.setTextColor(20, 20, 20);
        doc.text('Candy: ' + o.items.map((it) => `${it.cantidad} × ${it.nombre}`).join(', '), 8, y, { maxWidth: 84 });
      }
    });

    doc.save(`entradas-orden-${o.order_id}.pdf`);
  }

  fechaLarga(iso: string): string {
    return new Date(iso).toLocaleString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA,
    });
  }
}