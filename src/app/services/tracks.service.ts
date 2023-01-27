import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { TrackType } from "../utils/constants";
import { Filter, FilterInstance, Track } from "../utils/interfaces";

@Injectable({
	providedIn: "root"
})
export class TracksService {
	
	//Subject to add filter to the current track
	public addFilterSubject = new Subject<FilterInstance>;
	public tracksSubject = new Subject<Track[]>;

	tracks: Track[] = [];

	constructor() { }

	addFilter(filter: Filter) {
		//Creates a new instance of the filter and sets it to enabled
		let instance = Object.assign({}, filter, {enabled: true}) as FilterInstance;
		//Emits the new filter instance to the subject (the tracks panel)
		this.addFilterSubject.next(instance);
	}

	getTracks(): Track[] {
		return this.tracks;
	}

	addTrack(type: TrackType = TrackType.VIDEO) {
		//Adds a track with a name of "Track " + the number of tracks in the array
		// It skips the track number when a track with that number in its name already exists

		let number = 0;

		this.tracks.forEach((track, index) => {
			//Finds the track with the highest id
			if (track.id >= number) {
				number = track.id + 1;
			}
		});

		let track = {
			id: number,
			name: `Track ${number}`,
			colour: this.setTrackColour(),
			type: type,
			isVisible: true
		};

		// Adds the track to the array
		this.tracks.push(track);
		this.tracksSubject.next(this.tracks);
	}

	setTrackColour() {
		//Generates a random hex colour
		return '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
	}

	deleteTrack(trackID: number) {
		//Deletes the track from the array by filtering out
		this.tracks = this.tracks.filter(t => t.id !== trackID);
		this.tracksSubject.next(this.tracks);
	}
}