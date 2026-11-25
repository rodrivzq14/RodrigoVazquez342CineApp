import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Resenas } from './resenas';

describe('Resenas', () => {
  let component: Resenas;
  let fixture: ComponentFixture<Resenas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resenas],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Resenas);
    fixture.componentRef.setInput('movieId', 1);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
