import { NO_ERRORS_SCHEMA } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule, NoopAnimationsModule } from "@angular/platform-browser/animations";
import { RouterTestingModule } from "@angular/router/testing";
import { ConfirmationService, MessageService } from "primeng/api";
import { AppComponent } from "./app.component";

window.api = {
  emit: () => {},
  on: () => {},
  once: () => {},
}

describe("AppComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        BrowserAnimationsModule,
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        MessageService,
        ConfirmationService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it("should create the app", () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  //Unit test for title
  it("should have as title 'GraphX", () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('GraphX');
	});

  // it("should render title", () => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   fixture.detectChanges();
  //   const compiled = fixture.nativeElement as HTMLElement;
  //   expect(compiled.querySelector(".content span")?.textContent).toContain("VideoEditor app is running!");
  // });
});
