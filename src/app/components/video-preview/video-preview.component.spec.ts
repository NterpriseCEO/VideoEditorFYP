import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { VideoPreviewComponent } from './video-preview.component';

describe('VideoPreviewComponent', () => {
	let component: VideoPreviewComponent;
	let fixture: ComponentFixture<VideoPreviewComponent>;
	let nativeElement: any;
	let instance: any;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [VideoPreviewComponent]
		})
			.compileComponents();

		//create a mock video stream object
		const videoStream = new MediaStream();
// 
		//Spy on the mock video stream object using getUserMedia
		spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(Promise.resolve(videoStream));

		fixture = TestBed.createComponent(VideoPreviewComponent);
		component = fixture.componentInstance;
		nativeElement = fixture.nativeElement;
		instance = fixture.debugElement.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should have a video', () => {
		//checks if a video element is present in the html
		expect(nativeElement.querySelector('video')).toBeTruthy();
	});

	it('should have a canvas', done => {
		// //check if a canvas element is present in the html every 100ms for 5 seconds
		// instance.changeSource();
		// // instance.drawCanvas();
		// fixture.detectChanges();

		setTimeout(() => {
			expect(nativeElement.querySelector('canvas')).toBeTruthy();
			done();//
		},9000);

	});
});
