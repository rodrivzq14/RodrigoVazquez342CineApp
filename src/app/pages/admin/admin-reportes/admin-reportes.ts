import { Component, ElementRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import type { Chart } from 'chart.js';
import { FilaCandy, FilaFacturacion, FilaMasVistas, ReporteService } from '../../../services/reporte.service';
import { FechaArPipe } from '../../../pipes/fecha-ar-pipe';
import { hoyAr, sumarDias } from '../../../utils/fechas';

// Colores de las películas en el gráfico (se repiten si hay más)
const COLORES = ['#b3261e', '#1d6aa8', '#2c7a4b', '#8a5a00', '#6b3fb0', '#d9735c', '#6e6559'];

@Component({
  imports: [CurrencyPipe, DecimalPipe, FechaArPipe],
  selector: 'app-admin-reportes',
  styleUrl: './admin-reportes.css',
  templateUrl: './admin-reportes.html',
})
export class AdminReportes implements OnDestroy {
  private reportes = inject(ReporteService);

  readonly desde = signal(sumarDias(hoyAr(), -29));
  readonly hasta = signal(hoyAr());
  readonly agrupar = signal<'week' | 'month'>('week');

  readonly dias = signal<FilaFacturacion[]>([]);
  readonly masVistas = signal<FilaMasVistas[]>([]);
  readonly candy = signal<FilaCandy[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  readonly totales = computed(() =>
    this.dias().reduce(
      (t, d) => ({
        compras: t.compras + d.compras,
        entradas: t.entradas + d.entradas,
        facturacion: t.facturacion + d.facturacion,
        credito: t.credito + d.credito_usado,
      }),
      { compras: 0, entradas: 0, facturacion: 0, credito: 0 },
    ),
  );

  // En la tabla solo mostramos los días que tuvieron ventas, si no son 30 filas de ceros
  readonly diasConVentas = computed(() => this.dias().filter((d) => d.compras > 0));

  private graficoPeliculas = viewChild<ElementRef<HTMLCanvasElement>>('lienzoPeliculas');
  private graficoCandy = viewChild<ElementRef<HTMLCanvasElement>>('lienzoCandy');
  private charts: Chart[] = [];

  constructor() {
    this.cargar();
  }

  ngOnDestroy() {
    this.charts.forEach((c) => c.destroy());
  }

  rangoRapido(dias: number | 'mes') {
    const hoy = hoyAr();
    this.hasta.set(hoy);
    this.desde.set(dias === 'mes' ? hoy.slice(0, 8) + '01' : sumarDias(hoy, -(dias - 1)));
    this.cargar();
  }

  cambiarFecha(cual: 'desde' | 'hasta', valor: string) {
    if (!valor) return;
    (cual === 'desde' ? this.desde : this.hasta).set(valor);
    if (this.desde() <= this.hasta()) this.cargar();
  }

  cambiarAgrupar(valor: 'week' | 'month') {
    this.agrupar.set(valor);
    this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    this.error.set('');
    try {
      const [dias, masVistas, candy] = await Promise.all([
        this.reportes.facturacion(this.desde(), this.hasta()),
        this.reportes.masVistas(this.agrupar(), this.desde(), this.hasta()),
        this.reportes.candy(this.desde(), this.hasta()),
      ]);
      this.dias.set(dias);
      this.masVistas.set(masVistas);
      this.candy.set(candy);
      await this.dibujar();
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudieron cargar los reportes');
    } finally {
      this.cargando.set(false);
    }
  }

  // ---------- Gráficos ----------

  private async dibujar() {
    // chart.js se carga recién acá, así no pesa en el resto de la app
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);
    Chart.defaults.color = '#6e6559';
    Chart.defaults.font.family = 'DM Sans, sans-serif';

    this.charts.forEach((c) => c.destroy());
    this.charts = [];

    // Más vistas: una barra por período, apilada por película
    const canvasPeliculas = this.graficoPeliculas()?.nativeElement;
    if (canvasPeliculas && this.masVistas().length) {
      const periodos = [...new Set(this.masVistas().map((f) => f.periodo))];
      const titulos = [...new Set(this.masVistas().map((f) => f.titulo))];
      this.charts.push(
        new Chart(canvasPeliculas, {
          type: 'bar',
          data: {
            labels: periodos.map((p) => this.etiquetaPeriodo(p)),
            datasets: titulos.map((titulo, i) => ({
              label: titulo,
              backgroundColor: COLORES[i % COLORES.length],
              data: periodos.map((p) => this.masVistas().find((f) => f.periodo === p && f.titulo === titulo)?.entradas ?? 0),
            })),
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { stacked: true }, y: { stacked: true, ticks: { precision: 0 } } },
          },
        }),
      );
    }

    // Candy: barras horizontales, la primera es el más vendido
    const canvasCandy = this.graficoCandy()?.nativeElement;
    if (canvasCandy && this.candy().length) {
      this.charts.push(
        new Chart(canvasCandy, {
          type: 'bar',
          data: {
            labels: this.candy().map((c) => c.producto),
            datasets: [{
              label: 'Unidades',
              data: this.candy().map((c) => c.unidades),
              backgroundColor: this.candy().map((_, i) => (i === 0 ? '#b3261e' : '#ddd3c2')),
              borderColor: '#1d1a16',
              borderWidth: 1,
            }],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { ticks: { precision: 0 } } },
          },
        }),
      );
    }
  }

  etiquetaPeriodo(iso: string): string {
    const [anio, mes, dia] = iso.split('-');
    return this.agrupar() === 'month'
      ? new Date(+anio, +mes - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
      : `Semana del ${dia}/${mes}`;
  }

  // ---------- Exportar ----------

  private nombreArchivo(extension: string): string {
    return `facturacion_${this.desde()}_al_${this.hasta()}.${extension}`;
  }

  private pesos(n: number): string {
    return '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
  }

  async exportarPdf() {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const t = this.totales();

    doc.setFontSize(18);
    doc.text('El Proyector · Reporte de facturación', 14, 18);
    doc.setFontSize(10);
    doc.text(`Del ${this.desde()} al ${this.hasta()}`, 14, 25);
    doc.text(`Facturación: ${this.pesos(t.facturacion)} · Entradas: ${t.entradas} · Compras: ${t.compras}`, 14, 31);

    autoTable(doc, {
      startY: 37,
      head: [['Día', 'Compras', 'Entradas', 'Facturación', 'Pagado con crédito']],
      body: this.diasConVentas().map((d) => [d.dia, d.compras, d.entradas, this.pesos(d.facturacion), this.pesos(d.credito_usado)]),
      foot: [['Total', t.compras, t.entradas, this.pesos(t.facturacion), this.pesos(t.credito)]],
      headStyles: { fillColor: [29, 26, 22] },
      footStyles: { fillColor: [179, 38, 30], textColor: [255, 250, 242] },
    });

    if (this.candy().length) {
      autoTable(doc, {
        head: [['Producto del candy', 'Unidades vendidas']],
        body: this.candy().map((c) => [c.producto, c.unidades]),
        headStyles: { fillColor: [29, 26, 22] },
      });
    }

    doc.save(this.nombreArchivo('pdf'));
  }

  async exportarExcel() {
    const { Workbook } = await import('exceljs');
    const libro = new Workbook();
    const t = this.totales();

    const hoja = libro.addWorksheet('Facturación');
    hoja.columns = [
      { header: 'Día', key: 'dia', width: 14 },
      { header: 'Compras', key: 'compras', width: 10 },
      { header: 'Entradas', key: 'entradas', width: 10 },
      { header: 'Facturación', key: 'facturacion', width: 14, style: { numFmt: '"$"#,##0' } },
      { header: 'Pagado con crédito', key: 'credito_usado', width: 18, style: { numFmt: '"$"#,##0' } },
    ];
    hoja.getRow(1).font = { bold: true };
    this.dias().forEach((d) => hoja.addRow(d));
    const total = hoja.addRow({ dia: 'Total', compras: t.compras, entradas: t.entradas, facturacion: t.facturacion, credito_usado: t.credito });
    total.font = { bold: true };

    const vistas = libro.addWorksheet('Más vistas');
    vistas.columns = [
      { header: this.agrupar() === 'week' ? 'Semana' : 'Mes', key: 'periodo', width: 22 },
      { header: 'Película', key: 'titulo', width: 28 },
      { header: 'Entradas', key: 'entradas', width: 10 },
    ];
    vistas.getRow(1).font = { bold: true };
    this.masVistas().forEach((f) => vistas.addRow({ ...f, periodo: this.etiquetaPeriodo(f.periodo) }));

    const candy = libro.addWorksheet('Candy');
    candy.columns = [
      { header: 'Producto', key: 'producto', width: 28 },
      { header: 'Unidades', key: 'unidades', width: 10 },
    ];
    candy.getRow(1).font = { bold: true };
    this.candy().forEach((c) => candy.addRow(c));

    // Descargar el archivo
    const buffer = await libro.xlsx.writeBuffer();
    const url = URL.createObjectURL(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = this.nombreArchivo('xlsx');
    a.click();
    URL.revokeObjectURL(url);
  }
}
