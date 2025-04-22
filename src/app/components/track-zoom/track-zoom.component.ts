import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, ViewChild } from "@angular/core";
import { ProjectFileService } from "src/app/services/project-file-service.service";
import { TracksService } from "src/app/services/tracks.service";
import { ZoomSliderPosition } from "src/app/utils/interfaces";
import { clamp } from "src/app/utils/utils";

@Component({
	selector: "app-track-zoom",
	templateUrl: "./track-zoom.component.html",
	styleUrls: ["./track-zoom.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackZoomComponent {

	@ViewChild("zoomSliderWrapper") zoomSliderWrapper!: ElementRef;
	@ViewChild("zoomSlider") zoomSlider!: ElementRef;


	isDragging: boolean = false;
	isDraggingLeft: boolean = false;
	isDraggingRight: boolean = false;
	isDraggingMiddle: boolean = false;
	currentPercentage: number = 0;

	slider: ZoomSliderPosition = {
		left: 0,
		width: 100,
		right: 100
	};

	constructor(
		private tracksService: TracksService,
		private pfService: ProjectFileService,
		private changeDetector: ChangeDetectorRef
	) {}


	@HostListener("document:mouseup", ["$event.target"])
	public click(targetElement: HTMLElement) {
		//Checks if the click is inside the tracksNgForList element
		//and resets the dragged clip if it isn't
		const clickedInside = this.zoomSliderWrapper.nativeElement.contains(targetElement);
		if(!clickedInside) {
			this.isDragging = false;
		}
	}

	startDrag(event: MouseEvent) {
		this.isDragging = true;

		const rect = this.zoomSlider.nativeElement.getBoundingClientRect();
		const wrapperRect = this.zoomSliderWrapper.nativeElement.getBoundingClientRect();

		this.isDraggingMiddle = false;
		// X position relative to the left edge of the slider component
		const xPos = event.clientX - wrapperRect.left;
		this.currentPercentage = (100 / wrapperRect.width) * xPos;

		//Checks if the mouse is within the inside the left and right side of the slider
		if(event.clientX >= rect.right - 20 && event.clientX <= rect.right) {
			this.isDraggingRight = true;
		}else if(event.clientX <= rect.left + 20 && event.clientX >= rect.left) {
			this.isDraggingLeft = true;
		}else {
			this.isDraggingMiddle = true;
		}
	}

	dragSlider(event: MouseEvent) {
		if(this.isDragging) {
			const rect = this.zoomSlider.nativeElement.getBoundingClientRect();
			const wrapperRect = this.zoomSliderWrapper.nativeElement.getBoundingClientRect();
			const xPos = event.clientX - wrapperRect.left;
			const percentage = (100 / wrapperRect.width) * xPos;
			//Checks if the mouse is within the left and right side of the slider but not outside the slider
			if(this.isDraggingRight && percentage >= this.slider.left + 2 && percentage <= 100 && !this.isDraggingMiddle) {
				this.slider.right = parseFloat(percentage.toFixed(2));
			}else if(this.isDraggingLeft && percentage >= 0 && percentage <= this.slider.right - 2 && !this.isDraggingMiddle) {
				this.slider.left = parseFloat(percentage.toFixed(2));
				this.slider.right = this.slider.left + parseFloat((this.slider.right - this.slider.left).toFixed(2));
			}else if(this.isDraggingMiddle) {
				// Calculate the % change from the center position to the mouse position
				const change = percentage - this.currentPercentage;
				this.currentPercentage = percentage;
				this.slider.left = parseFloat(clamp(this.slider.left + change, 100 - this.slider.width).toFixed(2));
				this.slider.right = parseFloat(clamp(this.slider.right + change, 100, this.slider.width).toFixed(2));
			}

			this.changeDetector.markForCheck();
			this.slider.width = this.slider.right - this.slider.left;
			this.tracksService.zoomSliderResizeSubject.next(this.slider);
		}
	}

	stopDrag() {
		this.isDragging = false
		this.isDraggingLeft = false;
		this.isDraggingRight = false;
	}
}