import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { EsperaPerfil, EsperaService } from '../../services/espera.service';
import { FechaArPipe } from '../../pipes/fecha-ar-pipe';
import { MiCompra } from '../../models/order';

@Component({
  imports: [RouterLink, CurrencyPipe, DecimalPipe, NgTemplateOutlet, FechaArPipe],
  selector: 'app-profile-page',
  styleUrl: './profile-page.css',
  templateUrl: './profile-page.html',
})
export class ProfilePage {
  readonly auth = inject(AuthService);
  private orders = inject(OrderService);
  private esperaService = inject(EsperaService);

  readonly compras = signal<MiCompra[]>([]);
  readonly esperas = signal<EsperaPerfil[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly cancelando = signal<number | null>(null);

  // Próximas: las que siguen en pie y todavía no pasaron. Todo lo demás (pasadas o canceladas) va al historial.
  private esProxima = (c: MiCompra) => c.estado === 'pagada' && new Date(c.starts_at) > new Date();

  readonly proximas = computed(() => this.compras().filter(this.esProxima).reverse());
  readonly anteriores = computed(() => this.compras().filter((c) => !this.esProxima(c)));

  constructor() {
    this.cargar();
  }

  private async cargar() {
    try {
      const [compras, esperas] = await Promise.all([this.orders.misCompras(), this.esperaService.misEsperas().catch(() => [])]);
      this.compras.set(compras);
      this.esperas.set(esperas);
    } catch {
      this.error.set('No pudimos cargar tus compras');
    } finally {
      this.cargando.set(false);
    }
  }

  async cancelar(c: MiCompra) {
    const devolucion = c.total + c.credito_usado;
    const ok = confirm(
      `¿Cancelar la compra de ${c.titulo}?\n\n` +
        `No se devuelve dinero: se te acreditan $${devolucion.toLocaleString('es-AR')} de crédito para usar en otra compra.`,
    );
    if (!ok) return;

    this.cancelando.set(c.id);
    this.error.set('');
    this.mensaje.set('');
    try {
      const credito = await this.orders.cancelar(c.id);
      this.mensaje.set(`Compra cancelada. Se acreditaron $${credito.toLocaleString('es-AR')} a tu cuenta.`);
      await Promise.all([this.auth.refreshProfile(), this.cargar()]);
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo cancelar la compra');
    } finally {
      this.cancelando.set(null);
    }
  }
}
