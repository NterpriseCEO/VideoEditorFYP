import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SanitiseUrlPipe } from "src/app/utils/sanitise-url";

import { ClipComponent } from "./clip.component";

describe("ClipComponent", () => {
  let component: ClipComponent;
  let fixture: ComponentFixture<ClipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ClipComponent,
        SanitiseUrlPipe
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClipComponent);
    component = fixture.componentInstance;
    component.clip = {
      name: "Clip 1",
      location: "C:\\Users\\User\\Videos\\clip1.mp4",
      totalDuration: 100,
      duration: 100,
      in: 0,
      startTime: 0
    }
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
