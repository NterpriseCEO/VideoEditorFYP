import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { ClipInstance, Track } from "src/app/utils/interfaces";

@Component({
	selector: "app-track-contents",
	templateUrl: "./track-contents.component.html",
	styleUrls: ["./track-contents.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackContentsComponent implements OnChanges {

	@Input() clips!: ClipInstance[];
	@Input() colour!: string;

	trackWidth: number = 0;

	constructor(private changeDetector: ChangeDetectorRef) {}

	ngOnChanges(changes: SimpleChanges) {
		if(this.clips.length > 0) {
			this.trackWidth = 0;

			//Finds the clip with the highest start time (not necessarily the last clip in the array)
			let lastClip = this.clips.reduce((prev, current) => (prev.startTime > current.startTime) ? prev : current);

			//Sets the width of the track = to the end coords of the last clip
			this.trackWidth = (lastClip.startTime + lastClip.duration)*10;
		}
	}
}
