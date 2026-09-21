import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettlementOverview } from './settlement-overview';

describe('SettlementOverview', () => {
  let component: SettlementOverview;
  let fixture: ComponentFixture<SettlementOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettlementOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettlementOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
