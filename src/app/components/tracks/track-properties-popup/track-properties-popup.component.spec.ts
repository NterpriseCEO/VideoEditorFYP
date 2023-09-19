import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackPropertiesPopupComponent } from './track-properties-popup.component';

describe('TrackPropertiesPopupComponent', () => {
  let component: TrackPropertiesPopupComponent;
  let fixture: ComponentFixture<TrackPropertiesPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrackPropertiesPopupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackPropertiesPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
