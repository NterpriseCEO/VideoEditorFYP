import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { TracksService } from "src/app/services/tracks.service";
import { Track } from "src/app/utils/interfaces";

@Component({
	selector: "app-track",
	templateUrl: "./track.component.html",
	styleUrls: ["./track.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackComponent {

	@Input() track!: Track;

	//Output ontrackDelete event
	@Output() onTrackDelete = new EventEmitter();

	isRecording: boolean = false;

	isEditingName: boolean = false;

	constructor(
		private changeDetector: ChangeDetectorRef,
		private tracksService: TracksService,
	) {}

	toggleRecording() {
		this.isRecording = !this.isRecording;

		window.api.emit("toggle-recording", this.isRecording);
	}
}
