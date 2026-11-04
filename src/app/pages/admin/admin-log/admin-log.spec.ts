import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminLog } from './admin-log';

describe('AdminLog', () => {
  let component: AdminLog;
  let fixture: ComponentFixture<AdminLog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLog],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
