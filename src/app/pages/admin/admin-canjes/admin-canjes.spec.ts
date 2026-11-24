import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminCanjes } from './admin-canjes';

describe('AdminCanjes', () => {
  let component: AdminCanjes;
  let fixture: ComponentFixture<AdminCanjes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCanjes],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCanjes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
