import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminScreenings } from './admin-screenings';

describe('AdminScreenings', () => {
  let component: AdminScreenings;
  let fixture: ComponentFixture<AdminScreenings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminScreenings],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminScreenings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
