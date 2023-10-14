import { ChangeDetectorRef } from "@angular/core";
import { ClipService } from "src/app/services/clip.service";
import { TracksService } from "src/app/services/tracks.service";

//helper parent class
export class TrackHelpers {

	constructor(
		public tracksService: TracksService,
		public changeDetector: ChangeDetectorRef,
		public cs : ClipService
	) {}

	//Gets the mouse poisition relative to the zoom slider's zoom level
	getMousePosition(event: MouseEvent, parentNode: HTMLElement) {
		let mousePosition = event.clientX - parentNode.getBoundingClientRect().left + parentNode.scrollLeft - 200;
		mousePosition = Math.round(mousePosition / 10) * 10;

		//Gets the number of ms between each gap
		return mousePosition * this.msPerPX();
	}

	getClipWidth(clip) {
		return clip.duration / this.msPerPX();
	}

	getClipPosition(clip) {
		return clip.startTime / this.msPerPX();
	}

	msPerPX() {
		return this.tracksService.timelineIntervalGap / 100;
	}
}