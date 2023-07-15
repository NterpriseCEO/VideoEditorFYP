import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartupViewComponent } from './startup-view.component';

describe('StartupViewComponent', () => {
  let component: StartupViewComponent;
  let fixture: ComponentFixture<StartupViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StartupViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StartupViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  // it("should show message when table is empty", () => {
  //   const app = fixture.debugElement.componentInstance;
  //   const h2 = fixture.debugElement.nativeElement.querySelector('h2');
  //   expect(h2.textContent).toContain("No recently opened projects.");
  // });
});
