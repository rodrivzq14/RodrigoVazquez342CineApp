import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovieForm } from './movie-form';

describe('MovieForm', () => {
  let component: MovieForm;
  let fixture: ComponentFixture<MovieForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieForm],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
