import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Canjes } from './canjes';

describe('Canjes', () => {
  let component: Canjes;
  let fixture: ComponentFixture<Canjes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Canjes],
    }).compileComponents();

    fixture = TestBed.createComponent(Canjes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
