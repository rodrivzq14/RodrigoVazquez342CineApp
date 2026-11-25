import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Canjes } from './canjes';

describe('Canjes', () => {
  let component: Canjes;
  let fixture: ComponentFixture<Canjes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Canjes],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Canjes);
    fixture.componentRef.setInput('puntos', 0);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
