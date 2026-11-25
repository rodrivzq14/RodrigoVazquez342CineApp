import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SiRol } from './si-rol';

// Componente de prueba para poder usar la directiva en un template
@Component({
  imports: [SiRol],
  template: `<p *appSiRol="['admin']">solo admin</p>`,
})
class Prueba {}

describe('SiRol', () => {
  it('no muestra nada si no hay nadie logueado', async () => {
    const fixture = TestBed.createComponent(Prueba);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('p')).toBeNull();
  });
});
