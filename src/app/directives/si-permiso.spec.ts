import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SiPermiso } from './si-permiso';

// Componente de prueba para poder usar la directiva en un template
@Component({
  imports: [SiPermiso],
  template: `<p *appSiPermiso="'reportes'">reportes</p>`,
})
class Prueba {}

describe('SiPermiso', () => {
  it('no muestra nada si no hay nadie logueado', async () => {
    const fixture = TestBed.createComponent(Prueba);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('p')).toBeNull();
  });
});
