import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";

import { TrackPropertiesPanelComponent } from "./track-properties-panel.component";

describe("TrackPropertiesPanelComponent", () => {
	let component: TrackPropertiesPanelComponent;
	let fixture: ComponentFixture<TrackPropertiesPanelComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [
				TrackPropertiesPanelComponent
			],
			imports: [
				FormsModule
			],
			providers: [
				MessageService
			]
		})
			.compileComponents();

		fixture = TestBed.createComponent(TrackPropertiesPanelComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});