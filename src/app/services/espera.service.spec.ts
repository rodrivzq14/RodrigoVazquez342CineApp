import { TestBed } from '@angular/core/testing';
import { EsperaService } from './espera.service';

describe('EsperaService', () => {
  let service: EsperaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EsperaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
