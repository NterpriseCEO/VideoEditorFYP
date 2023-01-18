import { Component, OnInit } from "@angular/core";
import { TracksService } from "src/app/services/tracks.service";
import { Track } from "src/app/utils/interfaces";

@Component({
	selector: "app-tracks-panel",
	templateUrl: "./tracks-panel.component.html",
	styleUrls: ["./tracks-panel.component.scss"]
})
export class TracksPanelComponent {

	tracks: Track[] = [];

	constructor(public tracksService: TracksService) {
		//Subscribes to the addTrackSubject in the tracks service
		tracksService.tracksSubject.subscribe((tracks: Track[]) => {
			this.tracks = tracks;
		});
	}
}
