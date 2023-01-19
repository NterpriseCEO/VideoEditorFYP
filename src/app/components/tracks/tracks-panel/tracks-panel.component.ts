import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { TracksService } from "src/app/services/tracks.service";
import { Track } from "src/app/utils/interfaces";

@Component({
	selector: "app-tracks-panel",
	templateUrl: "./tracks-panel.component.html",
	styleUrls: ["./tracks-panel.component.scss"]
})
export class TracksPanelComponent implements AfterViewChecked {

	tracks: Track[] = [];
	tracksCount: number = 0;

	addingTrack: boolean = false;

	@ViewChild("tracksList") tracksList!: ElementRef;

	constructor(public tracksService: TracksService) {
		//Subscribes to the addTrackSubject in the tracks service
		tracksService.tracksSubject.subscribe((tracks: Track[]) => {
			//Checks if a track is being added not removed
			this.addingTrack = this.tracksCount < tracks.length;
			this.tracksCount = tracks.length;

			this.tracks = tracks;
		});
	}

	ngAfterViewChecked() {
		//Scrolls to the bottom when a track is added
		if(this.addingTrack) {
			this.addingTrack = false;
			this.tracksList.nativeElement.scrollTop = this.tracksList.nativeElement.scrollHeight;
		}
	}
}
