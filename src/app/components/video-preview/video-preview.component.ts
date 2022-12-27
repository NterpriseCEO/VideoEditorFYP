import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, NgZone, ViewChild } from '@angular/core';
import { FilterLibrary } from '../../utils/constants';
import { Filter } from '../../utils/interfaces';
import { ImageFilters } from 'src/app/utils/ImageFilters';
// import * as GPU from '../../utils/gpu.js';
// const GPU = require('../../utils/gpu.js');

const fx = require("glfx-es6");

@Component({
	selector: 'app-video-preview',
	templateUrl: './video-preview.component.html',
	styleUrls: ['./video-preview.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoPreviewComponent {

	@ViewChild('video') video!: ElementRef;
	@ViewChild('replaceWithCanvas') replaceWithCanvas!: ElementRef;
	
	//Testing
	fps: number = 0;

	src: any;
	canvas: any;

	videoNativeElement: any;

	videoWidth: number = 0;
	videoHeight: number = 0;

	selectedSource: string = "webcam";
	sourceId: string = "";

	animationFrame: any;

	worker: any;

	enabledFilters: Filter[] = [];

	isFullscreen: boolean = false;

	constructor(
		private changeDetectorRef: ChangeDetectorRef,
		private ngZone: NgZone
	) {
		window.api.on('get-filters', (_, filters) => this.ngZone.run(() => {
			this.enabledFilters = filters;
			this.changeDetectorRef.detectChanges();
		}));

		window.api.on("source-changed", (_, sourceData) => this.ngZone.run(() => {
			this.selectedSource = sourceData.source;
			this.sourceId = sourceData.sourceId;
			this.changeSource();
			this.changeDetectorRef.detectChanges();
		}));

		//KEEP THIS CODE FOR REFERENCE
		// if(typeof Worker !== 'undefined') {
		// 	// Create a new
		// 	this.worker = new Worker(new URL('./video-preview.worker', import.meta.url));
		// 	this.worker.onmessage = ({ data }) => {
		// 		console.log(`page got message: ${data}`);
		// 	};
		// 	this.worker.postMessage('hello');
		// } else {
		// 	// Web Workers are not supported in this environment.
		// 	// You should add a fallback so that your program still executes correctly.
		// }

		//Sets the initial source
		this.changeSource();
	}

	//page resize event
	@HostListener('window:resize', ['$event'])
	onResize() {
		//Resizes the canvas when the window is resized
		//to make sure the canvas is always the same size as the video
		this.setCanvasDimensions();
	}

	toggleFullScreen() {
		this.isFullscreen = !this.isFullscreen;

		setTimeout(() => {
			this.setCanvasDimensions();
		}, 100);
	}

	setCanvasDimensions() {
		//Sets the canvas' dimensions to the same as the video
		const parentWidth = this.canvas?.parentNode.getBoundingClientRect().width;
		const parentHeight = this.canvas?.parentNode.getBoundingClientRect().height;
		const [videoWidth, videoHeight] = this.videoDimensions(this.videoNativeElement);

		this.videoWidth = videoWidth;
		this.videoHeight = videoHeight;

		this.canvas.style.width = `${this.videoWidth}px`;
		this.canvas.style.height = `${this.videoHeight}px`;

		this.canvas.style.top = (parentHeight / 2 - this.videoHeight / 2) + "px";
		this.canvas.style.left = (parentWidth / 2 - this.videoWidth / 2) + "px";
	}

	//THIS CODE NEEDS TO BE REWRITTEN (probably)
	videoDimensions(video: HTMLVideoElement) {
		const videoRatio = video.videoWidth / video.videoHeight;
		let width = video.offsetWidth,
		height = video.offsetHeight;

		const videoElementRatio = width/height;
		if(videoElementRatio > videoRatio) {
			width = height * videoRatio;
		} else {
			height = width / videoRatio;
		}
		return [width, height];
	}

	drawCanvas() {
		//The element that the canvas will replace
		const nativeElement = this.replaceWithCanvas.nativeElement;

		//Checks if the canvas has already been created
		if(!this.canvas) {
			try {
				//Init the GLFX canvas
				this.canvas = fx.canvas();
			} catch (e) {
				console.log(e);
				return;
			}
	
			
			//Insert the canvas into the DOM and set the dimensions
			nativeElement.parentNode.insertBefore(this.canvas, nativeElement.firstChild);
			//Removes the placeholder element
			nativeElement.remove();
		}

		this.setCanvasDimensions();
		let imageFilters = new ImageFilters();

		//Creates a WebGL texture from the video element
		const texture = this.canvas.texture(this.videoNativeElement);
		const ifTexture = imageFilters.texture(this.videoNativeElement);

		let now = window.performance.now();
		let then = window.performance.now();
		let fpsInterval = 1000 / 30;
		let elapsedTime = 0;

		let step = async () => {
			// console.time("draw");
			//Measure the time it takes to draw the canvas
			let start = window.performance.now();
			//Loads the contents of the video element into the texture

			now = window.performance.now();
			elapsedTime = now - then;

			if(elapsedTime > fpsInterval) {
				texture.loadContentsOf(this.videoNativeElement);
				let draw = this.canvas.draw(texture);

				const length = this.enabledFilters.length - 1;

				//Applies the filters to the canvas
				this.enabledFilters.forEach((filter: Filter, index: number) => {
					//Applies the GLFX filters here
					if(filter.type === FilterLibrary.GLFX) {
						//Calls the filter function by name and applies the properties
						draw = draw[filter.function](...filter.properties);

						//Draws the filters to the canvas if the next filter is not an ImageFilters filter
						if(this.enabledFilters[index + 1]?.type === FilterLibrary.IMAGE_FILTERS) {
							draw.update();
						}
					}else {
						const wasGLFXOrWasIndex0 = this.enabledFilters[index - 1]?.type === FilterLibrary.GLFX || index === 0;

						//previous filter was an ImageFilters filter
						if(wasGLFXOrWasIndex0) {
							let imageToDraw = index === 0 ? this.videoNativeElement : this.canvas;
							ifTexture.texture(imageToDraw);
						}

						imageFilters = imageFilters[filter.function](...filter.properties);

						//Draws the filters to the visible canvas if the next filter is not an ImageFilters filter
						if(this.enabledFilters[index + 1]?.type === FilterLibrary.GLFX || index == length) {
							//Load the texture from the hidden canvas
							texture.loadContentsOf(imageFilters.getImageData());
							draw = this.canvas.draw(texture);
						}
					}
				});
				draw.update();
			}


			// this.fps = window.performance.now() - start;

			// console.timeEnd("draw");
			this.animationFrame = this.videoNativeElement.requestVideoFrameCallback(step);
		};
		this.videoNativeElement.requestVideoFrameCallback(step);
	}

	changeSource(source?: string) {
		//Essentially stop the previous drawCanvas function
		window.cancelAnimationFrame(this.animationFrame);
		//Checks if the source is a video, webcam or desktop capture
		if((this.selectedSource || source) === "webcam") {
			//accesses the webcam
			navigator.mediaDevices.getUserMedia({ video: true })
			.then(stream => {
				//The video preview element src
				this.src = stream;

				this.playPreview();
			});
		}else if ((this.selectedSource || source) === "screen") {
			//Gets the list of desktop capture options
			window.api.emit("get-stream");
			window.api.on("stream", (_: any, stream: any[]) => this.ngZone.run(() => {
				//Initiates the desktop capture and plays it
				navigator.mediaDevices.getUserMedia({
					audio: false,
					video: {
						mandatory: {
							chromeMediaSource: "desktop",
							chromeMediaSourceId: stream.find(({id}) => id === this.sourceId).id, //The id of the desktop capture
							minWidth: 1280,
							maxWidth: 1280,
							minHeight: 720,
							maxHeight: 720,
						}
					} as MediaTrackConstraints,
				}).then((s) => {
					//The video preview element src
					this.src = s;

					this.playPreview();
				});
			}));
		}else if((this.selectedSource || source) === "video") {
			//Sets the video src = to the video in assets folder
			this.videoNativeElement = this.video.nativeElement;
			this.changeDetectorRef.markForCheck();
			this.src = "/assets/video.mp4";
			this.playPreview();
		}
	}

	//This starts playing the preview so that the canvas can be drawn
	playPreview() {
		//The video element within the ViewChild object
		this.videoNativeElement = this.video.nativeElement;
		this.changeDetectorRef.detectChanges();
		
		this.videoNativeElement.onloadedmetadata = () => {
			//Once the video is loaded, the video is played and the filters canvas is created
			this.videoNativeElement.play();

			this.drawCanvas();
		};
	}
}