import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MovieDetail } from './movie-detail';

describe('MovieDetail', () => {
  let component: MovieDetail;
  let fixture: ComponentFixture<MovieDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieDetail],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieDetail);
    fixture.componentRef.setInput('id', '1');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
