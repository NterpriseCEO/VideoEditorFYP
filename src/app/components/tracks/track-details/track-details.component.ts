import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from "@angular/core";
import { ProjectFileService } from "src/app/services/project-file-service.service";
import { TracksService } from "src/app/services/tracks.service";
import { Track } from "src/app/utils/interfaces";
import { getHexBrightness } from "src/app/utils/utils";
import { SourceSelectorComponent } from "../source-selector/source-selector.component";

@Component({
	selector: "app-track-details",
	templateUrl: "./track-details.component.html",
	styleUrls: ["./track-details.component.scss"]
})
export class TrackDetailsComponent implements OnChanges {

	@ViewChild("sourceSelector") sourceSelector!: SourceSelectorComponent;

	@Input() track!: Track;

	@Output() onTrackDelete = new EventEmitter();

	isRecording: boolean = false;

	isEditingName: boolean = false;

	titleColour: string = "white";

	constructor(
		private tracksService: TracksService,
		private pfService: ProjectFileService
	) { }

	toggleRecording() {
		this.isRecording = !this.isRecording;

		this.tracksService.setCurrentlyRecordingTrack(this.track);

		window.api.emit("toggle-recording", {isRecording: this.isRecording, track: this.track});
	}

	ngOnChanges(changes: SimpleChanges) {
		if(changes["track"]) {
			this.titleColour = getHexBrightness(changes["track"].currentValue?.colour) > 100 ? "black" : "white";
		}
	}

	changeSource() {
		this.sourceSelector.showDialog();
	}

	updateSource(event: Event) {
		this.tracksService.setTrackSource(this.track.id, event);
	}

	toggleVisibility() {
		this.tracksService.toggleTrackVisibility(this.track);

		//Updates the project file object
		this.pfService.updateTracks(this.tracksService.getTracks());
	}
}
