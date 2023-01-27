import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from "@angular/core";
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

	constructor() { }

	toggleRecording() {
		this.isRecording = !this.isRecording;

		window.api.emit("toggle-recording", this.isRecording);
	}

	ngOnChanges(changes: SimpleChanges) {
		if(changes["track"]) {
			this.titleColour = getHexBrightness(changes["track"].currentValue.colour) > 100 ? "black" : "white";
		}
	}

	changeSource() {
		this.sourceSelector.showDialog();
	}
}
