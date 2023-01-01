import { ComponentFixture, TestBed } from "@angular/core/testing";
import { VideoPreviewComponent } from "src/app/components/video-preview/video-preview.component";

import { PreviewComponent } from "./preview.component";

describe("PreviewComponent", () => {
	let component: PreviewComponent;
	let fixture: ComponentFixture<PreviewComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [
				PreviewComponent,
				VideoPreviewComponent
			]
		})
			.compileComponents();

		fixture = TestBed.createComponent(PreviewComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
