import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { TrackType } from "../utils/constants";
import { Filter, FilterInstance, Track } from "../utils/interfaces";
import { ProjectFileService } from "./project-file-service.service";

@Injectable({
	providedIn: "root"
})
export class TracksService {
	
	//Subject to add filter to the current track
	public filtersChangedSubject = new Subject();
	public tracksSubject = new Subject<Track[]>;

	tracks: Track[] = [];

	selectedTrack: Track | null = null;

	constructor(private pfService: ProjectFileService) {
		this.listenForTracks();
	}

	listenForTracks() {
		this.pfService.loadTracksSubject.subscribe((tracks) => {
			this.tracks = tracks;
			this.tracksSubject.next(this.tracks);
		});
	}

	addFilter(filter: Filter) {
		//Creates a new instance of the filter and sets it to enabled
		let instance: FilterInstance = Object.assign({}, filter, {enabled: true});
		
		//Adds the filter to the selected track
		if (!this.selectedTrack!.filters) {
			this.selectedTrack!.filters = [];
		}
		//Lets the track properties panel know that a filter has been added
		this.selectedTrack!.filters.push(instance);
		this.filtersChangedSubject.next(null);

		//Updates the project file object
		this.pfService.updateTracks(this.tracks);

		//sends the updated filters to the preview window
		window.api.emit("update-filters", this.selectedTrack);
	}

	removeFilter(filter: FilterInstance) {
		//Removes the filter from the selected track
		this.selectedTrack!.filters = this.selectedTrack!.filters!.filter((f) => f !== filter);
		this.filtersChangedSubject.next(null);

		//Updates the project file object
		this.pfService.updateTracks(this.tracks);

		window.api.emit("update-filters", this.selectedTrack);
	}

	toggleFilter(filter: FilterInstance) {
		//Toggles the filter on or off
		filter.enabled = !filter.enabled;
		this.filtersChangedSubject.next(null);

		//Updates the project file object
		this.pfService.updateTracks(this.tracks);

		window.api.emit("update-filters", this.selectedTrack);
	}

	getTracks(): Track[] {
		return this.tracks;
	}

	addTrack(type: TrackType = TrackType.VIDEO, source?: any) {
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
			isVisible: true,
			source: source,
		};

		// Adds the track to the array
		this.tracks.push(track);
		this.tracksSubject.next(this.tracks);
		this.selectedTrack = track;

		//Updates the project file object
		this.pfService.updateTracks(this.tracks);

		//Sends the tracks to the preview window
		window.api.emit("send-tracks", this.tracks);
	}

	setSelectedTrack(track: Track) {
		this.selectedTrack = track;
	}

	getSelectedTrack(): Track | null {
		return this.selectedTrack;
	}

	getSelectedTrackFilters(): FilterInstance[] | undefined {
		return this.selectedTrack?.filters;
	}

	setTrackColour() {
		//Generates a random hex colour
		return "#"+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, "0");
	}

	deleteTrack(trackID: number) {
		let selectedID = this.selectedTrack?.id;
		//Deletes the track from the array by filtering out
		this.tracks = this.tracks.filter(t => t.id !== trackID);
		if(selectedID === trackID) {
			this.selectedTrack = null;

			this.filtersChangedSubject.next(null);
		}
		this.tracksSubject.next(this.tracks);

		//Updates the project file object
		this.pfService.updateTracks(this.tracks);

		window.api.emit("send-tracks", this.tracks);
	}
}