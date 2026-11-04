import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminMovies } from './admin-movies';

describe('AdminMovies', () => {
  let component: AdminMovies;
  let fixture: ComponentFixture<AdminMovies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMovies],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMovies);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
