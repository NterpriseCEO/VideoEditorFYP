import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProjectFileService } from 'src/app/services/project-file-service.service';
import { TracksService } from 'src/app/services/tracks.service';
import { ZoomSliderPosition } from 'src/app/utils/interfaces';

@Component({
	selector: 'app-track-zoom',
	templateUrl: './track-zoom.component.html',
	styleUrls: ['./track-zoom.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackZoomComponent implements OnInit {

	@ViewChild('zoomSliderWrapper') zoomSliderWrapper!: ElementRef;
	@ViewChild('zoomSlider') zoomSlider!: ElementRef;


	isDragging: boolean = false;
	isDraggingLeft: boolean = false;
	isDraggingRight: boolean = false;

	sliderPosition: ZoomSliderPosition = {
		left: 0,
		right: 100
	};

	sliderWidth: number = 1000;

	constructor(
		private tracksService: TracksService,
		private pfService: ProjectFileService,
		private changeDetector: ChangeDetectorRef
	) {}

	ngOnInit() {
		this.tracksService.zoomSliderScrollSubject.subscribe(scrollPosition => {
			this.sliderPosition.left = scrollPosition;
			this.sliderPosition.right = this.sliderPosition.left + this.sliderWidth;
			this.changeDetector.detectChanges();
		});
	}


	@HostListener('document:mouseup', ['$event.target'])
	public click(targetElement: HTMLElement) {
		//Checks if the click is inside the tracksNgForList element
		//and resets the dragged clip if it isn't
		const clickedInside = this.zoomSliderWrapper.nativeElement.contains(targetElement);
		if (!clickedInside) {
			this.isDragging = false;
		}
	}

	startDrag(event: MouseEvent) {
		this.isDragging = true;

		const rect = this.zoomSlider.nativeElement.getBoundingClientRect();
		const wrapperRect = this.zoomSliderWrapper.nativeElement.getBoundingClientRect();
		const xPos = event.clientX - wrapperRect.left;

		//Checks if the mouse is within the inside the left and right side of the slider
		if (event.clientX >= rect.right - 20 && event.clientX <= rect.right) {
			this.isDraggingRight = true;
		}else if (event.clientX <= rect.left + 20 && event.clientX >= rect.left) {
			this.isDraggingLeft = true;
		}
	}

	dragSlider(event: MouseEvent) {
		if (this.isDragging) {
			const rect = this.zoomSlider.nativeElement.getBoundingClientRect();
			const wrapperRect = this.zoomSliderWrapper.nativeElement.getBoundingClientRect();
			const xPos = event.clientX - wrapperRect.left;

			const percentage = (100 / wrapperRect.width) * xPos;

			//Checks if the mouse is within the left and right side of the slider but not outside the slider
			if (this.isDraggingRight && percentage >= this.sliderPosition.left + 2 && percentage <= 100) {
				this.sliderPosition.right = percentage;
			} else if (this.isDraggingLeft && percentage >= 0 && percentage <= this.sliderPosition.right - 2) {
				this.sliderPosition.left = percentage;
				this.sliderPosition.right = this.sliderPosition.left + (this.sliderPosition.right - this.sliderPosition.left);
			}

			this.changeDetector.detectChanges();

			this.sliderWidth = this.sliderPosition.right - this.sliderPosition.left;
			
			this.tracksService.zoomSliderResizeSubject.next(this.sliderPosition);
		}
	}

	stopDrag() {
		this.isDragging = false
		this.isDraggingLeft = false;
		this.isDraggingRight = false;
	}
}