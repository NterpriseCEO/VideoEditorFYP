import { Component, OnInit } from "@angular/core";

@Component({
	selector: "app-tracks-panel",
	templateUrl: "./tracks-panel.component.html",
	styleUrls: ["./tracks-panel.component.scss"]
})
export class TracksPanelComponent {

	//an array of tracks
	tracks: any[] = [
		{name: "Track 1", id: 1},
		{name: "Track 2", id: 2},
		{name: "Track 3", id: 3},
		{name: "Track 4", id: 4},
		{name: "Track 5", id: 5}
	];

	constructor() { }

	addTrack() {
		//Adds a track with a name of "Track " + the number of tracks in the array
		// It skips the track number when a track with that number in its name already exists

		let number = 0;

		this.tracks.forEach((track, index) => {
			//Finds the track with the highest id
			if (track.id >= number) {
				number = track.id + 1;
			}
		});

		// Adds the track to the array
		this.tracks.push({name: `Track ${number}`, id: number});
	}

	deleteTrack(track: string) {
		//Deletes the track from the array by filtering out
		//the track that matches the track pased in
		this.tracks = this.tracks.filter(t => t !== track);
	}
}
