import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackZoomComponent } from './track-zoom.component';

describe('TrackZoomComponent', () => {
  let component: TrackZoomComponent;
  let fixture: ComponentFixture<TrackZoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrackZoomComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackZoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
