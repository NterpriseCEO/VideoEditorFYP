import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MenubarModule } from "primeng/menubar";

import { EditorToollbarComponent } from "./editor-toolbar.component";

describe("EditorToollbarComponent", () => {
	let component: EditorToollbarComponent;
	let fixture: ComponentFixture<EditorToollbarComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [
				EditorToollbarComponent
			],
			imports: [
				MenubarModule
			]
		})
			.compileComponents();

		fixture = TestBed.createComponent(EditorToollbarComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	//should have the correct title
	it("should have the correct page title", () => {
		expect(component.title).toEqual("Editor Toolbar");
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
