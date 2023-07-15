import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MessageService } from "primeng/api";
import { TrackType } from "src/app/utils/constants";

import { TrackDetailsComponent } from "./track-details.component";

describe("TrackDetailsComponent", () => {
  let component: TrackDetailsComponent;
  let fixture: ComponentFixture<TrackDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrackDetailsComponent ],
      providers: [
        MessageService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackDetailsComponent);
    component = fixture.componentInstance;
    component.track = {
      id: 0,
      isVisible: true,
      name: "Track 0",
      type: TrackType.VIDEO,
      colour: "#fff000"
    }
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
