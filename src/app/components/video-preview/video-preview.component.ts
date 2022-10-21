import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FilterLibrary } from '../../utils/constants';
import { Filter } from '../../utils/interfaces';
// import * as GPU from '../../utils/gpu.js';
// const GPU = require('../../utils/gpu.js');

const fx = require("glfx-es6");

@Component({
	selector: 'app-video-preview',
	templateUrl: './video-preview.component.html',
	styleUrls: ['./video-preview.component.scss']
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

	//The offscreen canvas that will be used to draw the ImageFiltersfilters
	offscreen: OffscreenCanvas = new OffscreenCanvas(333, 250);
	offscreenCtx: OffscreenCanvasRenderingContext2D | null = this.offscreen.getContext("2d", {willReadFrequently: true});

	filters: Filter[] = [
		{name: "zoomBlur", properties: [231.99996948242188, 293, 1], enabled: true, type: FilterLibrary.GLFX},
		{name: "bulgePinch", properties: [320, 239.5, 200, 1], enabled: true, type: FilterLibrary.GLFX},
		{name: "edgeWork", properties: [10], enabled: true, type: FilterLibrary.GLFX},
		{name: "hueSaturation", properties: [0.5, 0.5], enabled: true, type: FilterLibrary.IMAGE_FILTERS},
		{name: "hueSaturation", properties: [0.5, 0.5], enabled: true, type: FilterLibrary.IMAGE_FILTERS},
		{name: "sepia", properties: [1], enabled: true, type: FilterLibrary.GLFX},
		{name: "vignette", properties: [0.5, 0.5], enabled: true, type: FilterLibrary.GLFX},
		{name: "colorHalftone", properties: [320, 239.5, 0.25, 4], enabled: true, type: FilterLibrary.GLFX}
	];

	enabledFilters: Filter[] = [];

	constructor() {
		//accesses the webcam
		navigator.mediaDevices.getUserMedia({ video: true })
		.then(stream => {
			//The video prevew element src
			this.src = stream;
			//The video element within the ViewChild object
			this.videoNativeElement = this.video.nativeElement;

			this.videoNativeElement.onloadedmetadata = () => {
				//Once the video is loaded, the video is played and the filters canvas is created
				this.videoNativeElement.play();
				this.enabledFilters = this.filters.filter(filter => filter.enabled);
				this.drawCanvas();
				// this.drawCanvas();
				// this.drawCanvas();
				// this.drawCanvas();
			};
		});
	}

	//page resize event
	@HostListener('window:resize', ['$event'])
	onResize() {
		//Resizes the canvas when the window is resized
		//to make sure the canvas is always the same size as the video
		this.setCanvasDimensions();
	}

	setEnabledFilters() {
		//Gets a list of all the filters that are enabled
		this.enabledFilters = this.filters.filter(filter => filter.enabled);
	}


	setCanvasDimensions() {
		//Sets the canvas' dimensions to the same as the video
		const parentWidth = this.canvas.parentNode.getBoundingClientRect().width;
		const parentHeight = this.canvas.parentNode.getBoundingClientRect().height;
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

		try {
			//Init the GLFX canvas
			this.canvas = fx.canvas();
		} catch (e) {
			console.log(e);
			return;
		}

		//Insert the canvas into the DOM and set the dimensions
		nativeElement.parentNode.insertBefore(this.canvas, nativeElement.firstChild);
		this.setCanvasDimensions();
		//Removes the placeholder element
		nativeElement.remove();

		//Creates a WebGL texture from the video element
		const texture = this.canvas.texture(this.videoNativeElement);
		let imageData: ImageData;

		let step = () => {
			//Measure the time it takes to draw the canvas
			let start = window.performance.now();
			//Loads the contents of the video element into the texture
			texture.loadContentsOf(this.videoNativeElement);
			let draw = this.canvas.draw(texture);

			const length = this.enabledFilters.length - 1;

			//Applies the filters to the canvas
			this.enabledFilters.forEach((filter: Filter, index: number) => {
				//Applies the GLFX filters here
				if(filter.type === FilterLibrary.GLFX) {
					//Calls the filter function by name and applies the properties
					draw = draw[filter.name](...filter.properties);

					//Draws the filters to the canvas if the next filter is not an ImageFilters filter
					if(this.enabledFilters[index + 1]?.type === FilterLibrary.IMAGE_FILTERS) {
						draw.update();
					}
				}else {
					const wasGLFXOrWasIndex0 = this.enabledFilters[index - 1]?.type === FilterLibrary.GLFX || index === 0;

					//previous filter was an ImageFilters filter
					if(wasGLFXOrWasIndex0) {
						let imageToDraw = index === 0 ? this.videoNativeElement : this.canvas;
						this.offscreenCtx?.drawImage(imageToDraw, 0, 0, Math.floor(this.videoWidth), Math.floor(this.videoHeight));
					}

					//A test of the ImageFilters library
					const data = this.desaturate(
						this.binarize(wasGLFXOrWasIndex0 ? this.offscreenCtx?.getImageData(0, 0, Math.floor(this.videoWidth), Math.floor(this.videoHeight)) : imageData, 1)
					); 			
					if(data) {
						imageData = data;
					}
					
					// offscreenCtx?.putImageData(imageData, 0, 0, 0, 0, Math.floor(this.videoWidth), Math.floor(this.videoHeight));

					//Draws the filters to the visible canvas if the next filter is not an ImageFilters filter
					if(this.enabledFilters[index + 1]?.type === FilterLibrary.GLFX || index == length) {
						//Load the texture from the hidden canvas
						texture.loadContentsOf(imageData);
						draw = this.canvas.draw(texture);
					}
				}
			});

			draw.update();

			// this.fps = window.performance.now() - start;

			console.timeEnd("draw");
			window.requestAnimationFrame(step);
		};
		window.requestAnimationFrame(step);
	}

	binarize(srcImageData: any, threshold: any) {
		// const value = GPU.createKernel(() => {

		// });
		var srcPixels    = srcImageData.data,
			srcWidth     = srcImageData.width,
			srcHeight    = srcImageData.height,
			srcLength    = srcPixels.length,
			dstImageData = this.offscreenCtx?.createImageData(srcWidth, srcHeight),
			dstPixels    = dstImageData?.data;

		if (isNaN(threshold)) {
			threshold = 0.5;
		}

		threshold *= 255;

		if(!dstPixels) {
			return;
		}
		for (var i = 0; i < srcLength; i += 4) {
			var avg = srcPixels[i] + srcPixels[i + 1] + srcPixels[i + 2] / 3;

			dstPixels[i] = dstPixels[i + 1] = dstPixels[i + 2] = avg <= threshold ? 0 : 255;
			dstPixels[i + 3] = 255;
		}

		return dstImageData;
	};

	desaturate(srcImageData: any) {
		var srcPixels    = srcImageData.data,
			srcWidth     = srcImageData.width,
			srcHeight    = srcImageData.height,
			srcLength    = srcPixels.length,
			dstImageData = this.offscreenCtx?.createImageData(srcWidth, srcHeight),
			dstPixels    = dstImageData?.data;

		if(!dstPixels) {
			return;
		}

		for (var i = 0; i < srcLength; i += 4) {
			var r = srcPixels[i],
				g = srcPixels[i + 1],
				b = srcPixels[i + 2],
				max = (r > g) ? (r > b) ? r : b : (g > b) ? g : b,
				min = (r < g) ? (r < b) ? r : b : (g < b) ? g : b,
				avg = ((max + min) / 2) + 0.5 | 0;

			dstPixels[i] = dstPixels[i + 1] = dstPixels[i + 2] = avg;
			dstPixels[i + 3] = srcPixels[i + 3];
		}

		return dstImageData;
	};
}