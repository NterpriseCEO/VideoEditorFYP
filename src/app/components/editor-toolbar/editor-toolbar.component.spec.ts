import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConfirmationService, MessageService } from "primeng/api";
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
			],
			providers: [
				MessageService,
				ConfirmationService
			]
		})
			.compileComponents();

		fixture = TestBed.createComponent(EditorToollbarComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
