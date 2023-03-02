import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualViewComponent } from './manual-view.component';

describe('ManualViewComponent', () => {
  let component: ManualViewComponent;
  let fixture: ComponentFixture<ManualViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManualViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManualViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
