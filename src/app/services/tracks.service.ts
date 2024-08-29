import { Injectable, NgZone } from "@angular/core";
import { Subject } from "rxjs";
import { TrackType } from "../utils/constants";
import { ClipInstance, Filter, FilterInstance, Track, ZoomSliderPosition } from "../utils/interfaces";
import { ProjectFileService } from "./project-file-service.service";

@Injectable({
	providedIn: "root"
})
export class TracksService {
	
	//Subject to add filter to the current track
	public filtersChangedSubject = new Subject<boolean>();
	public tracksSubject = new Subject<{tracks: Track[], projectId?: number}>();
	public tracksLoadedFromProjectFileSubject = new Subject<Track[]>();
	public selectedTrackChangedSubject = new Subject<Track | null>();
	public previewStateSubject = new Subject<{isPlaying: boolean, isFinishedPlaying: boolean, currentTime?: number}>();
	public tracksPanelZoomSubject = new Subject<number>();
	trackMuteSubject = new Subject<Track>();

	tracks: Track[] = [];
	lastAddedTrack: TrackType = TrackType.VIDEO;

	selectedTrack: Track | null = null;
	selectedTrackIndex: number = 0;

	canSendTracks = false;

	currentlyRecordingTrack: Track | null = null;

	zoomSliderResizeSubject = new Subject<ZoomSliderPosition>();

	timelineIntervalGap: number = 5000;
	zoomSliderScrollSubject: Subject<number> = new Subject<number>();

	sourceSelectorTriggerSubject: Subject<void> = new Subject<void>();

	constructor(
		private pfService: ProjectFileService,
		private ngZone: NgZone,
	) {
		this.listenForEvents();
	}

	listenForEvents() {
		let interval;
		this.pfService.loadTracksSubject.subscribe((data: any) => {
			this.tracks = data.tracks;
			this.selectedTrack = this.tracks.find(track => track.id === this.selectedTrack?.id) ?? this.tracks[0];
			this.selectedTrackIndex = this.tracks.findIndex(track => track.id === this.selectedTrack?.id);
			this.selectedTrackChangedSubject.next(this.selectedTrack);
			this.tracksSubject.next({tracks: this.tracks, projectId: data.projectId});
			this.tracksLoadedFromProjectFileSubject.next(this.tracks);
			this.filtersChangedSubject.next(false);
			interval = setInterval(() => {
				//Waits until the preview window is
				//open to send the tracks to it
				if(this.canSendTracks) {
					window.api.emit("send-tracks", { tracks: this.tracks, resetPreview: data?.resetPreview });
					// this.tracks.forEach(track => this._hack(JSON.parse(JSON.stringify(track))));
					clearInterval(interval);
					interval = null;
				}
			}, 10);
		});

		window.api.on("preview-opened", () => this.ngZone.run(() => {
			this.canSendTracks = true;
			if(!interval) {
				window.api.emit("send-tracks", { tracks: this.tracks });
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

			this.tracksSubject.next({tracks: this.tracks, projectId: this.pfService.activeProject});
			this.pfService.updateTracks(this.tracks);
			window.api.emit("update-track-clips", this.currentlyRecordingTrack);
		}));
	}

	_hack(track: Track) {
		//This was a hack to fix the bug where the webcam stream is not shown in the preview window
		//I'm leaving it here in case it happens again and I want a quick fix
		track.filters = track.filters?.map((filter: FilterInstance, index: number) => {
			return {
				function: filter.function,
				category: filter.category,
				displayName: filter.displayName,
				properties: filter.properties ? filter.properties.map(prop => prop.value ?? prop.defaultValue) : [],
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
		if(!this.selectedTrack!.filters) {
			this.selectedTrack!.filters = [];
		}
		//Lets the track properties panel know that a filter has been added
		this.selectedTrack!.filters.push(instance);
		this.filtersChangedSubject.next(true);

		//sends the updated filters to the preview window
		window.api.emit("update-filters", this.selectedTrack);
	}

	removeFilter(filter: FilterInstance) {
		//Removes the filter from the selected track
		this.selectedTrack!.filters = this.selectedTrack!.filters!.filter((f) => f !== filter);

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

	addTrack(type: TrackType = this.lastAddedTrack, source?: any) {
		//Adds a track with a name of "Track " + the number of tracks in the array
		// It skips the track number when a track with that number in its name already exists

		if(type === TrackType.SCREEN_CAPTURE && !source) {
			this.sourceSelectorTriggerSubject.next();
			return;
		}

		let number = 0;

		this.tracks.forEach((track, index) => {
			//Finds the track with the highest id
			if(track.id >= number) {
				number = track.id + 1;
			}
		});

		let track: Track = {
			id: number,
			name: `Track ${number}`,
			colour: this.setTrackColour(),
			type: type,
			isVisible: true
		};

		if(source) {
			track.source = source;
		}

		// Adds the track to the array
		this.tracks.push(track);
		this.tracksSubject.next({tracks: this.tracks, projectId: this.pfService.activeProject});
		this.selectedTrack = track;

		this.selectedTrackChangedSubject.next(this.selectedTrack);
		this.filtersChangedSubject.next(false);

		//Updates the project file object
		this.pfService.updateTracks(this.tracks);

		//Sends the tracks to the preview window
		window.api.emit("send-tracks", { tracks: this.tracks });
		this.lastAddedTrack = type;
		// this.tracks.forEach(track => this._hack(JSON.parse(JSON.stringify(track))));
	}

	setSelectedTrack(track: Track) {
		this.selectedTrack = JSON.parse(JSON.stringify(track));
		this.selectedTrackIndex = this.tracks.findIndex(t => t.id === track.id);
		this.selectedTrackChangedSubject.next(this.selectedTrack);
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

	setTrackSource(trackID: number, source: any) {
		//Sets the source of the track with the given id
		let track = this.tracks.find(t => t.id === trackID);
		if(track) {
			track.source = source;
			this.tracksSubject.next({tracks: this.tracks, projectId: this.pfService.activeProject});
			window.api.emit("send-tracks", { tracks: this.tracks });
			// this.tracks.forEach(track => this._hack(JSON.parse(JSON.stringify(track))));
			this.pfService.updateTracks(this.tracks);
		}
	}

	deleteTrack(trackID: number) {
		let selectedID = this.selectedTrack?.id;
		let trackIndex = this.tracks.findIndex(t => t.id === trackID);
		//Deletes the track from the array by filtering out
		this.tracks = this.tracks.filter(t => t.id !== trackID);
		if(selectedID === trackID) {
			//The previous tracks is selected
			//if the currently selected track is deleted
			try {
				this.selectedTrack = this.tracks[trackIndex - 1];
				this.selectedTrackIndex = trackIndex - 1;
			}catch(error) {
				this.selectedTrack = null;
				this.selectedTrackIndex = 0;
			}
			this.selectedTrackChangedSubject.next(this.selectedTrack ?? null);

			this.filtersChangedSubject.next(false);
		}
		this.tracksSubject.next({tracks: this.tracks, projectId: this.pfService.activeProject});

		//Updates the project file object
		this.pfService.updateTracks(this.tracks);

		window.api.emit("send-tracks", { tracks: this.tracks });
		// this.tracks.forEach(track => this._hack(JSON.parse(JSON.stringify(track))));
	}

	setCurrentlyRecordingTrack(track: Track) {
		this.currentlyRecordingTrack = track;
	}

	toggleTrackVisibility(track: Track) {
		track.isVisible = !track.isVisible;
		this.tracksSubject.next({tracks: this.tracks, projectId: this.pfService.activeProject});
		this.pfService.updateTracks(this.tracks);
		window.api.emit("send-tracks", { tracks: this.tracks });
		// this._hack(JSON.parse(JSON.stringify(track)));
	}

	updateLayerFilter(layerFilter: any) {
		this.selectedTrack!.layerFilter = layerFilter;
		//Finds the track that matches the id of the selected track
		let track = this.tracks.find(t => t.id === this.selectedTrack!.id);
		//Updates the layer filter of the track
		track!.layerFilter = layerFilter;
		this.pfService.updateTracks(this.tracks);
		window.api.emit("update-layer-filter", this.selectedTrack);
	}

	toggleTrackMute(track: Track) {
		track.muted = !track.muted;
		this.tracksSubject.next({tracks: this.tracks, projectId: this.pfService.activeProject});
		this.pfService.updateTracks(this.tracks);
		window.api.emit("mute-track", track);

		this.trackMuteSubject.next(track);
	}

	selectTrackByIndex(index: number, delta: number = 0) {
		//Uses the delta to select the previous or next track and
		//modulo to loop back to the start or end of the array
		const newIndex = (index + delta + this.tracks.length) % (this.tracks.length);
		this.setSelectedTrack(this.tracks[newIndex]);
	}

	//Sets the selected track as the previous and next tracks
	selectPreviousTrack() {
		this.selectTrackByIndex(this.selectedTrackIndex, -1);
	}
	selectNextTrack() {
		this.selectTrackByIndex(this.selectedTrackIndex, 1);
	}

	alignClips() {
		//Aligns all clips in each track to come after each other
		this.tracks.forEach((track: Track) => {
			const clips = track.clips;
			clips?.forEach((clip: ClipInstance, i) => {
				//Sets the start time of the first clip to 0
				if(i === 0) {
					clip.startTime = 0;
					return;
				}
				clip.startTime = clips[i - 1].startTime + clips[i - 1].duration;
			});
		});

		this.pfService.updateTracks(this.tracks);
		window.api.emit("update-tracks", this.tracks);
	}

	//Gets the duration of the project by finding the end time of the clip that ends last
	getProjectDuration(): number {
		return this.tracks
			.map(track => track.clips?.at(-1))
			.map(clip => (clip?.startTime || 0) + (clip?.duration || 0))
			.sort((a, b) => (a > b) ? 1 : -1)
			.at(-1) ?? 0;
	}
}