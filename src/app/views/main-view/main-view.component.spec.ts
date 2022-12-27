import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditorToollbarComponent } from "src/app/components/editor-toolbar/editor-toolbar.component";
import { TrackPropertiesPanelComponent } from "src/app/components/tracks/track-properties-panel/track-properties-panel.component";
import { TracksPanelComponent } from "src/app/components/tracks/tracks-panel/tracks-panel.component";

import { MainViewComponent } from "./main-view.component";

describe("MainViewComponent", () => {
	let component: MainViewComponent;
	let fixture: ComponentFixture<MainViewComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [
				MainViewComponent,
				EditorToollbarComponent,
				TracksPanelComponent,
				TrackPropertiesPanelComponent
			]
		})
			.compileComponents();

		fixture = TestBed.createComponent(MainViewComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
