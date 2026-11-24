import { TestBed } from '@angular/core/testing';
import { CanjeService } from './canje.service';

describe('CanjeService', () => {
  let service: CanjeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanjeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
