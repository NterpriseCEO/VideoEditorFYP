import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from "@angular/core";
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

	constructor() {}

	ngOnChanges(changes: SimpleChanges) {
		if(this.clips.length > 0) {
			this.trackWidth = 0;
			//Calculates the width of the track based on the duration of all clips
			//in the track
			this.clips.forEach((clip: ClipInstance) => {
				this.trackWidth += clip.duration*10;
			});
		}
	}
}
