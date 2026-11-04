import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MovieService } from '../../../services/movie.service';
import { ScreeningService } from '../../../services/screening.service';
import { FechaArPipe } from '../../../pipes/fecha-ar-pipe';
import { Movie } from '../../../models/movie';
import { FuncionAdmin, ResultadoCarga, Room } from '../../../models/screening';

const ZONA = 'America/Argentina/Buenos_Aires';

// yyyy-mm-dd en hora argentina (es lo que usan los input type="date")
function isoDia(fecha: Date): string {
  return fecha.toLocaleDateString('en-CA', { timeZone: ZONA });
}

function sumarDias(iso: string, dias: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return isoDia(d);
}

// Validador del grupo: "hasta" no puede ser antes que "desde"
function rangoValido(group: AbstractControl): ValidationErrors | null {
  const { desde, hasta } = group.value;
  return desde && hasta && hasta < desde ? { rango: true } : null;
}

function alMenosUnDia(control: AbstractControl): ValidationErrors | null {
  return control.value?.length ? null : { sinDias: true };
}

@Component({
  imports: [ReactiveFormsModule, FechaArPipe],
  selector: 'app-admin-screenings',
  styleUrl: './admin-screenings.css',
  templateUrl: './admin-screenings.html',
})
export class AdminScreenings {
  private fb = inject(FormBuilder).nonNullable;
  private movieService = inject(MovieService);
  private screeningService = inject(ScreeningService);

  readonly diasSemana = [
    { n: 1, nombre: 'Lun' }, { n: 2, nombre: 'Mar' }, { n: 3, nombre: 'Mié' }, { n: 4, nombre: 'Jue' },
    { n: 5, nombre: 'Vie' }, { n: 6, nombre: 'Sáb' }, { n: 7, nombre: 'Dom' },
  ];
  readonly horasRapidas = ['14:00', '16:30', '18:00', '19:30', '20:30', '22:30'];
  readonly semanas = [1, 2, 4];
  readonly formatos = ['2D', '3D', '4D', '5D'];
  readonly idiomas = ['castellano', 'subtitulada'];

  readonly movies = signal<Movie[]>([]);
  readonly funciones = signal<FuncionAdmin[]>([]);
  readonly salas = signal<Room[]>([]);
  readonly resultado = signal<ResultadoCarga | null>(null);
  readonly error = signal('');
  readonly guardando = signal(false);
  readonly diaElegido = signal<string | null>(null);

  form = this.fb.group(
    {
      movie_id: [0, Validators.min(1)],
      dias: [[] as number[], alMenosUnDia],
      hora: ['18:00', Validators.required],
      desde: [isoDia(new Date()), Validators.required],
      hasta: [sumarDias(isoDia(new Date()), 6), Validators.required],
      formato: ['2D'],
      idioma: ['castellano'],
    },
    { validators: rangoValido },
  );

  // valueChanges como signal para poder usarlo en computed()
  private valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /** Cuántas funciones se van a intentar crear con lo elegido (se muestra antes de confirmar) */
  readonly cantidad = computed(() => {
    const { dias = [], desde, hasta } = this.valores();
    if (!desde || !hasta || hasta < desde) return 0;
    let total = 0;
    for (let d = desde; d <= hasta; d = sumarDias(d, 1)) {
      const isoDow = new Date(d + 'T12:00:00').getDay() || 7; // domingo: 0 -> 7
      if (dias.includes(isoDow)) total++;
    }
    return total;
  });

  // Listado de funciones agrupado por día
  readonly dias = computed(() => {
    const mapa = new Map<string, FuncionAdmin[]>();
    for (const f of this.funciones()) {
      const key = isoDia(new Date(f.starts_at));
      if (!mapa.has(key)) mapa.set(key, []);
      mapa.get(key)!.push(f);
    }
    return [...mapa.entries()].map(([key, funciones]) => ({ key, funciones }));
  });

  readonly diaActivo = computed(() => {
    const dias = this.dias();
    return dias.find((d) => d.key === this.diaElegido()) ?? dias[0] ?? null;
  });

  constructor() {
    this.cargar();
  }

  private async cargar() {
    try {
      const [movies, funciones, salas] = await Promise.all([
        this.movieService.getMovies(),
        this.screeningService.getProximas(),
        this.screeningService.getSalas(),
      ]);
      this.movies.set(movies);
      this.funciones.set(funciones);
      this.salas.set(salas);
    } catch {
      this.error.set('No se pudieron cargar los datos');
    }
  }

  toggleDia(n: number) {
    const actuales = this.form.controls.dias.value;
    const nuevos = actuales.includes(n) ? actuales.filter((d) => d !== n) : [...actuales, n];
    this.form.controls.dias.setValue(nuevos.sort());
    this.form.controls.dias.markAsTouched();
  }

  elegirSemanas(semanas: number) {
    this.form.controls.hasta.setValue(sumarDias(this.form.controls.desde.value, semanas * 7 - 1));
  }

  // generate_screenings devuelve el id de la sala, acá lo pasamos a nombre
  nombreSala(id: number): string {
    return this.salas().find((s) => s.id === id)?.nombre ?? `Sala ${id}`;
  }

  async crear() {
    if (this.form.invalid) return this.form.markAllAsTouched();

    this.guardando.set(true);
    this.error.set('');
    this.resultado.set(null);
    try {
      this.resultado.set(await this.screeningService.crearFunciones(this.form.getRawValue()));
      this.funciones.set(await this.screeningService.getProximas());
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudieron crear las funciones');
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminar(f: FuncionAdmin) {
    if (!confirm(`¿Eliminar la función de ${f.titulo} en ${f.sala}?`)) return;
    try {
      await this.screeningService.eliminar(f.id);
      this.funciones.update((lista) => lista.filter((x) => x.id !== f.id));
    } catch {
      // si ya vendió entradas la base no deja borrarla (foreign key)
      this.error.set('No se puede eliminar una función que ya tiene entradas vendidas');
    }
  }
}
