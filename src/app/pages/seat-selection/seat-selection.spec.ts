import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeatSelection } from './seat-selection';

describe('SeatSelection', () => {
  let component: SeatSelection;
  let fixture: ComponentFixture<SeatSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatSelection],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SeatSelection);
    fixture.componentRef.setInput('id', '1');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
