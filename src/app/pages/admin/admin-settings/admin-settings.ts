import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormRecord, ReactiveFormsModule, Validators } from '@angular/forms';
import { SettingsService } from '../../../services/settings.service';
import { CouponTipo } from '../../../models/coupon';

// Nombres lindos para las claves conocidas. Si aparece otra clave se muestra tal cual.
const ETIQUETAS: Record<string, string> = {
  precio_entrada: 'Precio entrada general ($)',
  precio_vip: 'Precio butaca VIP ($)',
};

type CuponForm = FormGroup<{
  id: FormControl<number>;
  tipo: FormControl<CouponTipo>;
  porcentaje: FormControl<number>;
  activo: FormControl<boolean>;
}>;

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-admin-settings',
  styleUrl: './admin-settings.css',
  templateUrl: './admin-settings.html',
})
export class AdminSettings {
  private settings = inject(SettingsService);
  private fb = inject(FormBuilder).nonNullable;

  readonly tiposCupon: { valor: CouponTipo; nombre: string }[] = [
    { valor: 'primera_compra', nombre: 'Primera compra' },
    { valor: 'mayores_50', nombre: 'Mayores de 50 años' },
  ];

  // FormRecord porque las claves vienen de la base, no las sabemos de antemano
  precios = new FormRecord<FormControl<number>>({});
  claves = signal<string[]>([]);
  private originales: Record<string, number> = {};

  // Un FormGroup por cada cupón que hay en la tabla
  cupones = this.fb.array<CuponForm>([]);

  nuevoCupon = this.fb.group({
    tipo: ['mayores_50' as CouponTipo],
    porcentaje: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
  });

  readonly error = signal('');
  readonly mensaje = signal('');
  readonly guardando = signal(false);

  constructor() {
    this.cargar();
  }

  private async cargar() {
    try {
      const [filas, cupones] = await Promise.all([this.settings.getTodas(), this.settings.getCupones()]);

      for (const f of filas) {
        this.precios.setControl(
          f.clave,
          new FormControl(f.valor, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
        );
        this.originales[f.clave] = f.valor;
      }
      this.claves.set(filas.map((f) => f.clave));

      this.cupones.clear();
      for (const c of cupones) {
        this.cupones.push(
          this.fb.group({
            id: [c.id],
            tipo: [c.tipo],
            porcentaje: [c.porcentaje, [Validators.required, Validators.min(1), Validators.max(100)]],
            activo: [c.activo],
          }),
        );
      }
    } catch {
      this.error.set('No se pudo cargar la configuración');
    }
  }

  etiqueta(clave: string): string {
    return ETIQUETAS[clave] ?? clave;
  }

  nombreTipo(tipo: CouponTipo): string {
    return this.tiposCupon.find((t) => t.valor === tipo)?.nombre ?? tipo;
  }

  // Los tres guardados hacen lo mismo: spinner, mensaje de ok o de error
  private async ejecutar(accion: () => Promise<void>, ok: string) {
    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');
    try {
      await accion();
      this.mensaje.set(ok);
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo guardar');
    } finally {
      this.guardando.set(false);
    }
  }

  async guardarPrecios() {
    if (this.precios.invalid) return this.precios.markAllAsTouched();

    // solo mandamos lo que cambió, así el log no se llena de cosas que no se tocaron
    const cambios = Object.entries(this.precios.getRawValue()).filter(([k, v]) => Number(v) !== this.originales[k]);
    if (!cambios.length) {
      this.mensaje.set('No hay cambios para guardar');
      return;
    }

    await this.ejecutar(async () => {
      for (const [clave, valor] of cambios) {
        await this.settings.guardar(clave, Number(valor));
        this.originales[clave] = Number(valor);
      }
    }, 'Precios actualizados');
  }

  async guardarCupon(grupo: CuponForm) {
    if (grupo.invalid) return grupo.markAllAsTouched();

    const { id, porcentaje, activo } = grupo.getRawValue();
    await this.ejecutar(() => this.settings.guardarCupon(id, Number(porcentaje), activo), 'Cupón actualizado');
    grupo.markAsPristine();
  }

  async crearCupon() {
    if (this.nuevoCupon.invalid) return this.nuevoCupon.markAllAsTouched();

    const { tipo, porcentaje } = this.nuevoCupon.getRawValue();
    await this.ejecutar(() => this.settings.crearCupon(tipo, Number(porcentaje)), 'Cupón creado');
    await this.cargar();
  }
}
