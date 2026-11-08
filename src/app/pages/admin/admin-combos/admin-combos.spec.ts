import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminCombos } from './admin-combos';

describe('AdminCombos', () => {
  let component: AdminCombos;
  let fixture: ComponentFixture<AdminCombos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCombos],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCombos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
