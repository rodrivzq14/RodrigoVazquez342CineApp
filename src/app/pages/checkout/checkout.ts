import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ScreeningService } from '../../services/screening.service';
import { CandyService } from '../../services/candy.service';
import { AuthService } from '../../services/auth.service';
import { Cantidad } from '../../components/cantidad/cantidad';
import { ScreeningDetail } from '../../models/screening';
import { ItemCompra, Quote } from '../../models/order';
import { Category, Combo, Product } from '../../models/product';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, Cantidad],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private orders = inject(OrderService);
  private screenings = inject(ScreeningService);
  private candy = inject(CandyService);
  readonly auth = inject(AuthService);
  private router = inject(Router);

  readonly id = input.required<string>();

  readonly funcion = signal<ScreeningDetail | null>(null);
  readonly quote = signal<Quote | null>(null);
  readonly combos = signal<Combo[]>([]);
  readonly productos = signal<Product[]>([]);
  readonly categorias = signal<Category[]>([]);
  readonly errorQuote = signal('');
  readonly errorCandy = signal('');
  readonly errorPago = signal('');
  readonly cargando = signal(true);
  readonly recalculando = signal(false);
  readonly pagando = signal(false);

  // Lo que eligió del candy: { 'combo-1': 2, 'producto-4': 1 }
  readonly seleccion = signal<Record<string, number>>({});
  readonly usarCredito = signal(false);

  readonly items = computed<ItemCompra[]>(() =>
    Object.entries(this.seleccion())
      .filter(([, cantidad]) => cantidad > 0)
      .map(([clave, cantidad]) => {
        const [tipo, id] = clave.split('-');
        return { tipo: tipo as ItemCompra['tipo'], id: Number(id), cantidad };
      }),
  );

  readonly combosElegidos = computed(() =>
    this.items().filter((i) => i.tipo === 'combo').reduce((total, i) => total + i.cantidad, 0),
  );

  readonly productosPorCategoria = computed(() =>
    this.categorias()
      .map((c) => ({ categoria: c, productos: this.productos().filter((p) => p.category_id === c.id) }))
      .filter((g) => g.productos.length > 0),
  );

  // Si el crédito cubre todo no hace falta la tarjeta
  readonly pagaConTarjeta = computed(() => (this.quote()?.total ?? 0) > 0);

  // Pago SIMULADO: se valida el formato, pero estos datos no se envían a ningún lado
  form = this.fb.group({
    numero: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
    titular: ['', Validators.required],
    vencimiento: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
  });

  private pedido = 0; // para descartar respuestas viejas si el usuario toca rápido

  async ngOnInit() {
    const funcionId = Number(this.id());
    try {
      const [funcion, quote, combos, productos, categorias] = await Promise.all([
        this.screenings.getScreening(funcionId),
        this.orders.quote(funcionId),
        this.candy.getCombos(),
        this.candy.getProductos(),
        this.candy.getCategorias(),
      ]);
      this.funcion.set(funcion);
      this.quote.set(quote);
      this.combos.set(combos);
      this.productos.set(productos);
      this.categorias.set(categorias);

      // Si tiene crédito (por ejemplo, porque le cancelaron una función) arranca usándolo
      if (quote.credito_disponible > 0) await this.toggleCredito(true);
    } catch (e: any) {
      this.errorQuote.set(e.message ?? 'No pudimos preparar tu compra');
    } finally {
      this.cargando.set(false);
    }
  }

  cantidadDe(tipo: ItemCompra['tipo'], id: number): number {
    return this.seleccion()[`${tipo}-${id}`] ?? 0;
  }

  /** Máximo de un combo: no puede haber más combos que entradas */
  maxCombo(id: number): number {
    const entradas = this.quote()?.cantidad ?? 0;
    return entradas - this.combosElegidos() + this.cantidadDe('combo', id);
  }

  async cambiar(tipo: ItemCompra['tipo'], id: number, cantidad: number) {
    this.seleccion.update((s) => ({ ...s, [`${tipo}-${id}`]: cantidad }));
    await this.recalcular();
  }

  async toggleCredito(usar: boolean) {
    this.usarCredito.set(usar);
    await this.recalcular();
  }

  private async recalcular() {
    const nro = ++this.pedido;
    this.recalculando.set(true);
    this.errorCandy.set('');
    try {
      const q = await this.orders.quote(Number(this.id()), this.items(), this.usarCredito());
      if (nro === this.pedido) this.quote.set(q);
    } catch (e: any) {
      if (nro === this.pedido) this.errorCandy.set(e.message ?? 'No se pudo actualizar el total');
    } finally {
      if (nro === this.pedido) this.recalculando.set(false);
    }
  }

  async pagar() {
    if (this.pagaConTarjeta() && this.form.invalid) return this.form.markAllAsTouched();

    this.pagando.set(true);
    this.errorPago.set('');
    try {
      if (this.pagaConTarjeta()) {
        await new Promise((r) => setTimeout(r, 1500)); // simula la pasarela de pago
      }
      const res = await this.orders.purchase(Number(this.id()), this.items(), this.usarCredito());
      await this.auth.refreshProfile(); // actualiza puntos y crédito en pantalla
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
