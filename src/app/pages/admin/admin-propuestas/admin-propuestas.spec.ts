import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminPropuestas } from './admin-propuestas';

describe('AdminPropuestas', () => {
  let component: AdminPropuestas;
  let fixture: ComponentFixture<AdminPropuestas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPropuestas],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPropuestas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
