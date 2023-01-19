import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FilterInstanceComponent } from "./filter-instance.component";

describe("FilterComponent", () => {
  let component: FilterInstanceComponent;
  let fixture: ComponentFixture<FilterInstanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilterInstanceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
