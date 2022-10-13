import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FilterLibrary } from 'src/app/utils/constants';
import { Filter } from 'src/app/utils/interfaces';
const fx = require("glfx-es6");

@Component({
	selector: 'app-video-preview',
	templateUrl: './video-preview.component.html',
	styleUrls: ['./video-preview.component.scss']
})
export class VideoPreviewComponent {
	
	@ViewChild('video') video!: ElementRef;
	@ViewChild('replaceWithCanvas') replaceWithCanvas!: ElementRef;

	src: any;

	canvas: any;

	videoNativeElement: any;

	getSampleCanvas: any;
	getSampleContext: any;

	filters: Filter[] = [
		{name: "zoomBlur", properties: [231.99996948242188, 293, 1], enabled: true, type: FilterLibrary.GLFX},
		{name: "bulgePinch", properties: [320, 239.5, 200, 1], enabled: true, type: FilterLibrary.GLFX},
		{name: "edgeWork", properties: [10], enabled: true, type: FilterLibrary.GLFX},
		{name: "sepia", properties: [1], enabled: true, type: FilterLibrary.GLFX},
		{name: "vignette", properties: [0.5, 0.5], enabled: true, type: FilterLibrary.GLFX},
		{name: "colorHalftone", properties: [320, 239.5, 0.25, 4], enabled: true, type: FilterLibrary.GLFX}
	];

	constructor() {
		//access webcam
		navigator.mediaDevices.getUserMedia({ video: true })
		.then(stream => {
			this.src = stream;
			this.videoNativeElement = this.video.nativeElement;

			this.videoNativeElement.onloadedmetadata = () => {
				this.videoNativeElement.play();
				this.allCanvases();
			};
		});
	}

	//page resize event
	@HostListener('window:resize', ['$event'])
	onResize() {
		this.setCanvasDimensions();
	}

	setCanvasDimensions() {
		const parentWidth = this.canvas.parentNode.getBoundingClientRect().width;
		const parentHeight = this.canvas.parentNode.getBoundingClientRect().height;
		const [videoWidth, videoHeight] = this.videoDimensions(this.videoNativeElement);

		this.canvas.style.width = `${videoWidth}px`;
		this.canvas.style.height = `${videoHeight}px`;

		this.canvas.style.top = (parentHeight / 2 - videoHeight / 2) + "px";
		this.canvas.style.left = (parentWidth / 2 - videoWidth / 2) + "px";
	}

	//THIS CODE NEEDS TO BE REWRITTEN
	videoDimensions(video: any) {
		const videoRatio = video.videoWidth / video.videoHeight;
		let width = video.offsetWidth,
		height = video.offsetHeight;
		
		const elementRatio = width/height;
		if(elementRatio > videoRatio) {
			width = height * videoRatio;
		} else {
			height = width / videoRatio;
		}
		return [width, height];
	}

	allCanvases() {
		//loop through all canvases
		const nativeElement = this.replaceWithCanvas.nativeElement;

		try {
			this.canvas = fx.canvas();
		} catch (e) {
			alert(e);
			return;
		}

		nativeElement.parentNode.insertBefore(this.canvas, nativeElement.firstChild);
		this.setCanvasDimensions();
		nativeElement.remove();

		const texture = this.canvas.texture(this.videoNativeElement);

		let step = () => {
			texture.loadContentsOf(this.videoNativeElement);
			let draw = this.canvas.draw(texture);

			this.filters.forEach((filter: Filter, index: number) => {
				if(!filter.enabled) {
					return;
				}
				if(filter.type === FilterLibrary.GLFX) {
					draw = draw[filter.name](...filter.properties);
					if(index+1 < this.filters.length && this.filters[index + 1].type === FilterLibrary.IMAGE_FILTERS) {
						draw.update();
					}
				}
			});

			draw.update();

			window.requestAnimationFrame(step);
		};
		window.requestAnimationFrame(step);
	}
}