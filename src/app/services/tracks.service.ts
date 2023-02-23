import { Injectable, NgZone } from "@angular/core";
import { Subject } from "rxjs";
import { TrackType } from "../utils/constants";
import { Filter, FilterInstance, Track } from "../utils/interfaces";
import { ProjectFileService } from "./project-file-service.service";

@Injectable({
	providedIn: "root"
})
export class TracksService {
	
	//Subject to add filter to the current track
	public filtersChangedSubject = new Subject<boolean>();
	public tracksSubject = new Subject<Track[]>;

	tracks: Track[] = [];

	selectedTrack: Track | null = null;

	canSendTracks = false;

	currentlyRecordingTrack: Track | null = null;

	constructor(
		private pfService: ProjectFileService,
		private ngZone: NgZone,
	) {
		this.listenForTracks();
	}

	listenForTracks() {
		let interval;
		this.pfService.loadTracksSubject.subscribe((tracks) => {
			this.tracks = tracks;
			interval = setInterval(() => {
				//Waits until the preview window is
				//open to send the tracks to it
				if(this.canSendTracks) {
					window.api.emit("send-tracks", this.tracks);
					this.selectedTrack = this.tracks[0];
					this.tracksSubject.next(this.tracks);
					this.tracks.forEach(track => this._hack(JSON.parse(JSON.stringify(track))));
					clearInterval(interval);
					interval = null;
				}
			}, 10);
		});

		window.api.on("preview-opened", () => this.ngZone.run(() => {
			this.canSendTracks = true;
			if(!interval) {
				window.api.emit("send-tracks", this.tracks);
			}
		}));

		window.api.on("preview-exited", () => this.ngZone.run(() => {
			this.canSendTracks = false;
		}));
		
		window.api.on("add-clip-to-track", (_, clip) => this.ngZone.run(() => {
			//find the end time of the last clip in the currently recording track
			let lastClipEndTime = 0;
			if(this.currentlyRecordingTrack!.clips && this.currentlyRecordingTrack!.clips.length > 0) {
				let lastClip = this.currentlyRecordingTrack!.clips[this.currentlyRecordingTrack!.clips.length - 1];
				lastClipEndTime = lastClip.startTime + lastClip.duration;
			}else {
				this.currentlyRecordingTrack!.clips = [];
			}
			//Adds the clip to the currently recording track
			this.currentlyRecordingTrack!.clips.push({
				...clip,
				startTime: lastClipEndTime,
				type: this.currentlyRecordingTrack!.type,
				in: 0
			});
			this.currentlyRecordingTrack!.clips = [...this.currentlyRecordingTrack!.clips];

			this.tracksSubject.next(this.tracks);
			this.pfService.updateTracks(this.tracks);
			window.api.emit("update-track-clips", this.currentlyRecordingTrack);
		}));
	}

	_hack(track: Track) {
		//This is a hack to fix the bug where the webcam stream is not shown in the preview window
		//A better solution would be to fix the bug itself and not plaster over it with a hack
		track.filters = track.filters?.map((filter: FilterInstance, index: number) => {
			return {
				function: filter.function,
				properties: filter.properties ? filter.properties.map(prop => prop.value.value ?? prop.defaultValue) : [],
				type: filter.type,
				enabled: filter.enabled
			}
		}) as FilterInstance[];
		
		window.api.emit("update-filters", track);
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
		this.filtersChangedSubject.next(true);

		//Updates the project file object
		this.pfService.updateTracks(this.tracks);

		//sends the updated filters to the preview window
		window.api.emit("update-filters", this.selectedTrack);
	}

	removeFilter(filter: FilterInstance) {
		//Removes the filter from the selected track
		this.selectedTrack!.filters = this.selectedTrack!.filters!.filter((f) => f !== filter);
		this.filtersChangedSubject.next(true);

		//Updates the project file object
		this.pfService.updateTracks(this.tracks);

		window.api.emit("update-filters", this.selectedTrack);
	}

	toggleFilter(filter: FilterInstance) {
		//Toggles the filter on or off
		filter.enabled = !filter.enabled;
		this.filtersChangedSubject.next(true);

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
		this.tracks.forEach(track => this._hack(JSON.parse(JSON.stringify(track))));
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

			this.filtersChangedSubject.next(true);
		}
		this.tracksSubject.next(this.tracks);

		//Updates the project file object
		this.pfService.updateTracks(this.tracks);

		window.api.emit("send-tracks", this.tracks);
		this.tracks.forEach(track => this._hack(JSON.parse(JSON.stringify(track))));
	}

	setCurrentlyRecordingTrack(track: Track) {
		this.currentlyRecordingTrack = track;
	}

	toggleTrackVisibility(track: Track) {
		track.isVisible = !track.isVisible;
		this.tracksSubject.next(this.tracks);
		this.pfService.updateTracks(this.tracks);
		window.api.emit("send-tracks", this.tracks);
		this._hack(JSON.parse(JSON.stringify(track)));
	}
}