import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Propuestas } from './propuestas';

describe('Propuestas', () => {
  let component: Propuestas;
  let fixture: ComponentFixture<Propuestas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Propuestas],
    }).compileComponents();

    fixture = TestBed.createComponent(Propuestas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
