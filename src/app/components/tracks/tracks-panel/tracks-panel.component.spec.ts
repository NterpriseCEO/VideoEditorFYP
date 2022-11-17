import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Panel, PanelModule } from "primeng/panel";

import { TracksPanelComponent } from "./tracks-panel.component";

import { MockBuilder, MockRender, ngMocks } from "ng-mocks";
import { AppModule } from "src/app/app.module";
import { Menubar } from "primeng/menubar";

describe("TracksPanelComponent", () => {
	let component: TracksPanelComponent;
	let fixture: ComponentFixture<TracksPanelComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [
				TracksPanelComponent
			]
		})
			.compileComponents();

		fixture = TestBed.createComponent(TracksPanelComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
