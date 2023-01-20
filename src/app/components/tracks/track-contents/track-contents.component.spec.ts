import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TrackContentsComponent } from "./track-contents.component";

describe("TrackComponent", () => {
  let component: TrackContentsComponent;
  let fixture: ComponentFixture<TrackContentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrackContentsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackContentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
