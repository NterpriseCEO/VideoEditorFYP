import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MessageService } from "primeng/api";

import { FilterSelectorComponent } from "./filter-selector.component";

describe("FilterSelectorComponent", () => {
	let component: FilterSelectorComponent;
	let fixture: ComponentFixture<FilterSelectorComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [FilterSelectorComponent],
			providers: [
				MessageService
			]
		})
			.compileComponents();

		fixture = TestBed.createComponent(FilterSelectorComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
