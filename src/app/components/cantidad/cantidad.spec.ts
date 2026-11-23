import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cantidad } from './cantidad';

describe('Cantidad', () => {
  let component: Cantidad;
  let fixture: ComponentFixture<Cantidad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cantidad],
    }).compileComponents();

    fixture = TestBed.createComponent(Cantidad);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
