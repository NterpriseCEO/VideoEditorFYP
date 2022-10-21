import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorToollbarComponent } from './editor-toolbar.component';

describe('EditorToollbarComponent', () => {
	let component: EditorToollbarComponent;
	let fixture: ComponentFixture<EditorToollbarComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [EditorToollbarComponent]
		})
			.compileComponents();

		fixture = TestBed.createComponent(EditorToollbarComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
