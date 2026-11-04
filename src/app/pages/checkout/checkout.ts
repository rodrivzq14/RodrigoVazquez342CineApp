import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ScreeningService } from '../../services/screening.service';
import { AuthService } from '../../services/auth.service';
import { ScreeningDetail } from '../../models/screening';
import { Quote } from '../../models/order';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private orders = inject(OrderService);
  private screenings = inject(ScreeningService);
  readonly auth = inject(AuthService);
  private router = inject(Router);

  readonly id = input.required<string>();

  readonly funcion = signal<ScreeningDetail | null>(null);
  readonly quote = signal<Quote | null>(null);
  readonly errorQuote = signal('');
  readonly errorPago = signal('');
  readonly cargando = signal(true);
  readonly pagando = signal(false);

  // Pago SIMULADO: se valida el formato, pero estos datos no se envían a ningún lado
  form = this.fb.group({
    numero: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
    titular: ['', Validators.required],
    vencimiento: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
  });

  async ngOnInit() {
    const funcionId = Number(this.id());
    try {
      this.funcion.set(await this.screenings.getScreening(funcionId));
      this.quote.set(await this.orders.quote(funcionId));
    } catch (e: any) {
      this.errorQuote.set(e.message ?? 'No pudimos preparar tu compra');
    } finally {
      this.cargando.set(false);
    }
  }

  async pagar() {
    if (this.form.invalid) return this.form.markAllAsTouched();

    this.pagando.set(true);
    this.errorPago.set('');
    try {
      await new Promise((r) => setTimeout(r, 1500)); // simula la pasarela de pago
      const res = await this.orders.purchase(Number(this.id()));
      await this.auth.refreshProfile(); // actualiza los puntos en pantalla
      this.router.navigate(['/confirmacion', res.order_id], {
        queryParams: { t: res.access_token },
      });
    } catch (e: any) {
      this.errorPago.set(e.message ?? 'No se pudo completar el pago');
    } finally {
      this.pagando.set(false);
    }
  }
}